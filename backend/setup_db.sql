DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'paynex') THEN
    CREATE USER paynex WITH PASSWORD 'paynex123';
  END IF;
END $$;

SELECT 'User paynex ready' AS status;
