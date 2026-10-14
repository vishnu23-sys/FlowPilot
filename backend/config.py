def resolve_jwt_secret(environ):
    """JWT secret from the environment; the dev fallback is only allowed in development/testing."""
    secret = environ.get('JWT_SECRET_KEY')
    if secret:
        return secret
    if environ.get('FLASK_ENV') == 'development' or environ.get('FLOWPILOT_TESTING') == '1':
        return 'dev-jwt-secret'
    raise RuntimeError('JWT_SECRET_KEY must be set outside development')
