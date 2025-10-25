function enrich_event(tag, timestamp, record)
  if record.user then
    record.user = string.match(record.user, "([^@]+)") or record.user
  end

  local log_text = record.log or ""

  if not record.operation or record.operation == "" then
    if string.find(log_text, "REREAD") or string.find(log_text, "Restart") then
      record.operation = "REREAD"
    elseif string.find(log_text, "Shutdown requested") or string.find(log_text, "Shutting down") then
      record.operation = "SHUTDOWN"
    elseif string.find(log_text, "Server exiting") or string.find(log_text, "Vendor daemon shutdown") then
      record.operation = "SERVER_EXIT"
    elseif string.find(log_text, "started") or string.find(log_text, "Starting vendor daemons") then
      record.operation = "START"
    end
  end

  return 2, timestamp, record
end
