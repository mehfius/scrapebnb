ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financeiro records."
ON financeiro FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create financeiro records for themselves."
ON financeiro FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financeiro records."
ON financeiro FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financeiro records."
ON financeiro FOR DELETE
TO authenticated
USING (auth.uid() = user_id);