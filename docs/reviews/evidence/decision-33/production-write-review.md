# Production verification boundary

Automatic approval review rejected the production real-playback write test before execution: it would write a synthetic popularity event, later removal was not part of the action, and production test-data mutation was not specifically authorized. No attempt was made to bypass the rejection.

Safer replacement: read-only served-artifact hash verification, new UI/browser checks, production/preview ranking reads and deployed database-binding inspection. The full actual playback/write/dedup/ranking pipeline was already verified in the separate preview database. Production write-through is not claimed as tested.
