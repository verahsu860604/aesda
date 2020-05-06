cnt_positive = 0
cnt_negative = 0
with open('cache_test_4') as f:
    for line in f:
        if line[:5] == 'CACHE':
            if line[6] == 'N':
                cnt_negative += 1
            else:
                cnt_positive += 1
print(cnt_positive)
print(cnt_negative)