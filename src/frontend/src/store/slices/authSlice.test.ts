import authReducer, {
  setCredentials,
  updateAccessToken,
  clearCredentials,
  logout,
} from './authSlice';

describe('authSlice', () => {
  const initialState = authReducer(undefined, { type: '@@INIT' });

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setCredentials', () => {
    it('should set user and access token', () => {
      const action = setCredentials({
        user: mockUser,
        accessToken: 'test-token',
      });

      const state = authReducer(initialState, action);

      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set credentials with refresh token', () => {
      const action = setCredentials({
        user: mockUser,
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
      });

      const state = authReducer(initialState, action);

      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test-token');
      expect(state.isAuthenticated).toBe(true);
      // Note: refreshToken is not stored in state (HttpOnly cookie)
    });

    it('should override existing credentials', () => {
      const existingState = {
        user: mockUser,
        accessToken: 'old-token',
        isAuthenticated: true,
      };

      const newUser = {
        ...mockUser,
        id: '2',
        email: 'new@example.com',
      };

      const action = setCredentials({
        user: newUser,
        accessToken: 'new-token',
      });

      const state = authReducer(existingState, action);

      expect(state.user).toEqual(newUser);
      expect(state.accessToken).toBe('new-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token', () => {
      const existingState = {
        user: mockUser,
        accessToken: 'old-token',
        isAuthenticated: true,
      };

      const action = updateAccessToken('new-token');
      const state = authReducer(existingState, action);

      expect(state.accessToken).toBe('new-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should update token even when not authenticated', () => {
      const action = updateAccessToken('new-token');
      const state = authReducer(initialState, action);

      expect(state.accessToken).toBe('new-token');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('clearCredentials', () => {
    it('should clear all credentials', () => {
      const existingState = {
        user: mockUser,
        accessToken: 'test-token',
        isAuthenticated: true,
      };

      const action = clearCredentials();
      const state = authReducer(existingState, action);

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should work when already cleared', () => {
      const action = clearCredentials();
      const state = authReducer(initialState, action);

      expect(state).toEqual(initialState);
    });
  });

  describe('logout', () => {
    it('should clear all credentials on logout', () => {
      const existingState = {
        user: mockUser,
        accessToken: 'test-token',
        isAuthenticated: true,
      };

      const action = logout();
      const state = authReducer(existingState, action);

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should work when already logged out', () => {
      const action = logout();
      const state = authReducer(initialState, action);

      expect(state).toEqual(initialState);
    });
  });

  describe('state transitions', () => {
    it('should handle login -> logout flow', () => {
      let state = initialState;

      // Login
      state = authReducer(
        state,
        setCredentials({
          user: mockUser,
          accessToken: 'test-token',
        })
      );
      expect(state.isAuthenticated).toBe(true);

      // Logout
      state = authReducer(state, logout());
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });

    it('should handle token refresh flow', () => {
      let state = authReducer(
        initialState,
        setCredentials({
          user: mockUser,
          accessToken: 'old-token',
        })
      );

      // Refresh token
      state = authReducer(state, updateAccessToken('new-token'));

      expect(state.accessToken).toBe('new-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle multiple logins', () => {
      let state = initialState;

      // First login
      state = authReducer(
        state,
        setCredentials({
          user: mockUser,
          accessToken: 'token-1',
        })
      );

      // Second login (different user)
      const newUser = {
        ...mockUser,
        id: '2',
        email: 'new@example.com',
      };

      state = authReducer(
        state,
        setCredentials({
          user: newUser,
          accessToken: 'token-2',
        })
      );

      expect(state.user).toEqual(newUser);
      expect(state.accessToken).toBe('token-2');
    });
  });
});
