-- Create notification function
CREATE OR REPLACE FUNCTION notify_analysis_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('analysis_update', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS analysis_update_trigger ON "Analysis";
CREATE TRIGGER analysis_update_trigger
AFTER INSERT ON "Analysis"
FOR EACH ROW
EXECUTE FUNCTION notify_analysis_update();