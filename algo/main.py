import parameters
import config
import market
import energy_source
import mpc_solver
import matplotlib.pyplot as plt
import json
import numpy as np
from time import sleep
if True:
    data = parameters.get_parameters()

    config = config.Config(**data['config'])
    energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
    for ess in energy_sources:
        ess.tuning_parameter_fit()
    markets = [market.Market(**kwargs) for kwargs in data['markets']]
    algo2 = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources)

    results = algo2.solve([[1.80, 1.81] for i in range(len(markets))], ['free', 'free', 'free'])

    with open('t.json', 'w') as f:
        json.dump(results, f)

with open('t.json', 'r') as f:
    results = json.load(f)
      
for key in results[0].keys():
    values = []
    for record in results:
        values.append(record[key])
    values = np.array(values)
    if key != 'soc' and key != 'soh':
        if len(values[0]) == 3:
            plt.subplot(3, 1, 1)
            plt.step(range(len(values)), values[:,0])
            plt.subplot(3, 1, 2)
            plt.step(range(len(values)), values[:,1])
            plt.subplot(3, 1, 3)
            plt.step(range(len(values)), values[:,2])
        elif len(values[0]) == 2:
            plt.subplot(2, 1, 1)
            plt.step(range(len(values)), values[:,0])
            plt.subplot(2, 1, 2)
            plt.step(range(len(values)), values[:,1])
        else:
            plt.step(range(len(values)), values)
    else:
        if len(values[0]) == 3:
            plt.subplot(3, 1, 1)
            plt.plot(range(len(values)), values[:,0])
            plt.subplot(3, 1, 2)
            plt.plot(range(len(values)), values[:,1])
            plt.subplot(3, 1, 3)
            plt.plot(range(len(values)), values[:,2])
        elif len(values[0]) == 2:
            plt.subplot(2, 1, 1)
            plt.plot(range(len(values)), values[:,0])
            plt.subplot(2, 1, 2)
            plt.plot(range(len(values)), values[:,1])
        else:
            plt.plot(range(len(values)), values)
    plt.title(key)
    plt.savefig('output/' + key)
    plt.clf()
