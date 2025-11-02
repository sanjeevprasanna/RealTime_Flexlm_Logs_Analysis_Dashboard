function enrich_event(tag, timestamp, record)
  -- Clean user field
  if record.user then
    record.user = string.match(record.user, "([^@]+)") or record.user
  end

  -- Get log text from either 'log' or 'message' field
  local log_text = record.log or record.message or ""

  -- Only enrich if operation not already set
  if not record.operation or record.operation == "" then
    -- REREAD detection
    if
        string.find(log_text, "REREAD")
        or string.find(log_text, "[Rr]ereading")
        or string.find(log_text, "[Rr]eread")
    then
      record.operation = "REREAD"

      -- SHUTDOWN detection
    elseif
        string.find(log_text, "Shutdown requested")
        or string.find(log_text, "Shutting down")
        or string.find(log_text, "Vendor daemon shutdown")
    then
      record.operation = "SHUTDOWN"

      -- SERVER_EXIT detection
    elseif string.find(log_text, "Server exiting") or string.find(log_text, "exiting$") then
      record.operation = "SERVER_EXIT"

      -- START detection
    elseif
        string.find(log_text, "FLEXnet Licensing.*started")
        or string.find(log_text, "Starting vendor daemons")
        or string.find(log_text, "Vendor daemon.*started")
    then
      record.operation = "START"

      -- OUT without counts = IN (checkin)
    elseif
        string.find(log_text, "OUT:%s%s+")
        and string.find(log_text, "handle")
        and not string.find(log_text, "%d+/%d+")
    then
      record.operation = "IN"
    end
  end

  return 2, timestamp, record
end
