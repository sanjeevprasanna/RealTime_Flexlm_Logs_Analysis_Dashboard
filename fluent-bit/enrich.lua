-- function enrich_event(tag, timestamp, record)
-- 	local daemon = record["daemon"]
--
-- 	if daemon == nil or daemon == "" then
-- 		= "unknown"
-- 	end
-- 	record["target_topic"] = "flexlm.logs." .. string.lower(daemon)
--
-- 	if record.user then
-- 		record.user = string.match(record.user, "([^@]+)") or record.user
-- 	end
--
-- 	local log_text = record.log or record.message or ""
--
-- 	if not record.operation or record.operation == "" then
-- 		if
-- 				string.find(log_text, "REREAD")
-- 				or string.find(log_text, "[Rr]ereading")
-- 				or string.find(log_text, "[Rr]eread")
-- 		then
-- 			record.operation = "REREAD"
-- 		elseif
-- 				string.find(log_text, "Shutdown requested")
-- 				or string.find(log_text, "Shutting down")
-- 				or string.find(log_text, "Vendor daemon shutdown")
-- 		then
-- 			record.operation = "SHUTDOWN"
-- 		elseif string.find(log_text, "Server exiting") or string.find(log_text, "exiting$") then
-- 			record.operation = "SERVER_EXIT"
-- 		elseif
-- 				string.find(log_text, "FLEXnet Licensing.*started")
-- 				or string.find(log_text, "Starting vendor daemons")
-- 				or string.find(log_text, "Vendor daemon.*started")
-- 		then
-- 			record.operation = "START"
-- 		elseif
-- 				string.find(log_text, "OUT:%s%s+")
-- 				and string.find(log_text, "handle")
-- 				and not string.find(log_text, "%d+/%d+")
-- 		then
-- 			record.operation = "IN"
-- 		end
-- 	end
--
-- 	return 2, timestamp, record
-- end

function enrich_event(tag, timestamp, record)
	local daemon = record["daemon"]

	-- Fallback logic:
	-- If daemon is missing, force Fluent Bit to use the fallback topic
	if daemon == nil or daemon == "" then
		record["target_topic"] = nil
	else
		record["target_topic"] = "flexlm.logs." .. string.lower(daemon)
	end

	-- Normalize user field (strip @hostname)
	if record.user then
		record.user = string.match(record.user, "([^@]+)") or record.user
	end

	-- Prepare log text for operation detection
	local log_text = record.log or record.message or ""

	-- Infer operation if missing
	if not record.operation or record.operation == "" then
		if
				string.find(log_text, "REREAD")
				or string.find(log_text, "[Rr]ereading")
				or string.find(log_text, "[Rr]eread")
		then
			record.operation = "REREAD"
		elseif
				string.find(log_text, "Shutdown requested")
				or string.find(log_text, "Shutting down")
				or string.find(log_text, "Vendor daemon shutdown")
		then
			record.operation = "SHUTDOWN"
		elseif string.find(log_text, "Server exiting") or string.find(log_text, "exiting$") then
			record.operation = "SERVER_EXIT"
		elseif
				string.find(log_text, "FLEXnet Licensing.*started")
				or string.find(log_text, "Starting vendor daemons")
				or string.find(log_text, "Vendor daemon.*started")
		then
			record.operation = "START"
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
