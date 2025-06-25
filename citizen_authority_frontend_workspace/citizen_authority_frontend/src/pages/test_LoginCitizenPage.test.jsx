import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import LoginCitizenPage from './LoginCitizenPage';
import { supabase } from '../supabase/supabaseClient';

jest.mock('../supabase/supabaseClient');
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(), // prevent real navigation
  };
});

function fillAndSubmitForm(email, password) {
  fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
}

describe('LoginCitizenPage – Profile Upsert & RLS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully upserts citizen profile when session and RLS permit (happy path)', async () => {
    // Mock Supabase login success, no existing profile match
    const mockUser = { id: 'user-123', email: 'foo@example.com' };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser }, error: null,
    });

    // First fetch: no profile yet (simulate maybeSingle returns null)
    supabase
      .from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', status: 406 } }),
      });

    // Simulate getSession returns an authenticated user
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    // Mock upsert to profiles succeeds
    supabase
      .from
      .mockReturnValueOnce({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          error: null,
          data: [{ id: 'user-123', email: 'foo@example.com', role: 'citizen' }],
        }),
      });

    // After upsert, fetch new profile (simulate role: 'citizen')
    supabase
      .from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'citizen' }, error: null }),
      });

    // Log login
    supabase
      .from
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({}),
      });

    render(<LoginCitizenPage />);

    fillAndSubmitForm('foo@example.com', 'strongpassword');

    await waitFor(() =>
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    );
    expect(supabase.from).toHaveBeenCalledTimes(4); // login check, upsert, re-fetch profile, logins table

    // Upsert call shape
    const upsertCall = supabase.from().upsert;
    expect(upsertCall).toBeDefined();

    // Should not show error on success
    expect(screen.queryByText(/failed to upsert/i)).not.toBeInTheDocument();
  });

  it('shows error if upsert fails due to RLS violation', async () => {
    // Mock login works, but profile fetch triggers upsert due to missing
    const mockUser = { id: 'user-rls', email: 'bar@example.com' };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser }, error: null,
    });

    // First profile fetch -> not found
    supabase
      .from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', status: 406 } }),
      });

    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    // Upsert triggers RLS error
    supabase
      .from
      .mockReturnValueOnce({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'new row violates row-level security policy for table "profiles"',
            status: 403,
            code: 'PGRST116',
          }
        }),
      });

    // After upsert (which fails), no subsequent profile fetch

    render(<LoginCitizenPage />);
    fillAndSubmitForm('bar@example.com', 'badpassword');

    await waitFor(() =>
      expect(screen.getByText(/failed to upsert citizen profile:/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/violates row-level security/i)).toBeInTheDocument();
  });

  it('shows session error if user session is not established before upsert', async () => {
    const mockUser = { id: 'user-567', email: 'baz@example.com' };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser }, error: null,
    });

    // First profile fetch triggers upsert
    supabase
      .from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', status: 406 } }),
      });

    // But session returns no user (simulate expired session)
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    render(<LoginCitizenPage />);
    fillAndSubmitForm('baz@example.com', 'anotherpass');

    await waitFor(() =>
      expect(screen.getByText(/user session not fully established/i)).toBeInTheDocument()
    );
  });

  it('renders and shows generic error if login fails', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null, error: { message: 'Invalid login', status: 400 }
    });

    render(<LoginCitizenPage />);
    fillAndSubmitForm('fail@example.com', 'bad');

    await waitFor(() =>
      expect(screen.getByText(/invalid login/i)).toBeInTheDocument()
    );
  });

  it('shows error if user returned from login is missing', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null }, error: null
    });

    render(<LoginCitizenPage />);
    fillAndSubmitForm('no-user@example.com', 'pw');

    await waitFor(() =>
      expect(screen.getByText(/login succeeded but user info is missing/i)).toBeInTheDocument()
    );
  });
});
