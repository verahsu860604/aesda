import sys
import json

assert len(sys.argv) > 1

parameters = json.loads(sys.argv[1])
print(parameters)
for item in parameters.items():
    print(item)
sys.stdout.flush()
