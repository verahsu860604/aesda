import sys
import json
import parameters
import config
import market
import energy_source
import mpc_solver
import matplotlib.pyplot as plt
import numpy as np
from time import sleep
import cyclic_coordinate
import pareto
import param_mapping

# file
import chardet
import pandas as pd
 
assert len(sys.argv) > 1
parameters_ui = json.loads(sys.argv[1])

data = param_mapping.map_param(parameters_ui)
# print(data)
# sys.stdout.flush()

config = config.Config(**data['config'])
energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
cost = sum([es.cost for es in energy_sources])
for ess in energy_sources:
    ess.tuning_parameter_fit()
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources, test_mode=True)

# read file
file_paths = data['market_data_file']
for market in file_paths:
    excel_data_df = pd.read_excel(file_paths[market])
    print(excel_data_df.iloc[:3])
    
    # todo: connect real data to algorithms

# Fake run
cc = cyclic_coordinate.CyclicCoordinate(markets, mpc, cost, really_run=False)
solutions_fake = cc.Algo5()
print("totl: " + str(len(solutions_fake)))
sys.stdout.flush()

cc = cyclic_coordinate.CyclicCoordinate(markets, mpc, cost)
solutions = cc.Algo5()
# print(solutions)
# pe = pareto.ParetoEfficient(solutions)
# inefficient_list, efficient_list = pe.pareto_analysis()
# tuple(Revenue, value_i(useless), soc_record, soh for each device, power record, prices, percentages)
# (216.29629629629628, 
# 2, 
# array([[1.        , 1.        ], [0.95061731, 1.        ]]), 
# (1.0, 1.0), 
# array([[[ 0.,  0.], [24.,  0.]],[[ 0.,  0.],[ 0., 12.]]]), 
# [2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469, 2.2222222222222223, 18.02469135802469], 
# (6.666666666666667, 10.0, 'free'))
# assert len(solutions) == 36

