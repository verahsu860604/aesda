import energy_source
import sys
assert len(sys.argv) > 1
visual = energy_source.Visualization(dod_profile_change_th=float(sys.argv[1]))
real_time, real_cycle = visual.threshold_test()
for i in range(len(real_time)):
	print([real_time[i],real_cycle[i]])
# print("[")
# for i in range(len(real_time)):
# 	print("{x:%d,y:%f},"%(real_time[i],real_cycle[i]), end = "")

# print("]")



