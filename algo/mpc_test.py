import parameters
import config
import market
import energy_source
import mpc_solver
import matplotlib.pyplot as plt
import json
import numpy as np
from time import sleep

parameters = {
    'energy_sources': [
        {
            'energy_type': 'Lithium-Ion',
            'soc_profile_energy_scale': 8.1,
            'efficiency_upward': 0.25, 
            'efficiency_downward': 0.25, 
            'self_discharge_ratio': 0
        },
        {
            'energy_type': 'PowerFlow',
            'self_discharge_ratio': 0,
            'soc_profile_energy_scale': 8.1,
            'efficiency_upward': 0.5, 
            'efficiency_downward': 0.5, 
        }
    ],
    'markets': [
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1,
            "test_mode": True
        },
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1,
            "test_mode": True
        },
        {
            "time_window_in_delivery": 4, # Primary
            "planning_phase_length": 60,
            "selection_phase_length": 60,
            "schedule_phase_length": 60,
            "delivery_phase_length": 60,
            "setpoint_interval": 1,
            "test_mode": True
        },
    ],
    'config':{
        'planning_horizon': 60,
        'soh_update_interval': 24 * 7 * 60,
        'tot_timestamps': 60
    }
}


def get_parameters():
    return parameters

data = get_parameters()

config = config.Config(**data['config'])
energy_sources = [energy_source.EnergySource(**kwargs) for kwargs in data['energy_sources']]
markets = [market.Market(**kwargs) for kwargs in data['markets']]
mpc = mpc_solver.MPCSolver(config=config, markets=markets, energy_sources=energy_sources, test_mode=True)

results = mpc.solve([[1.80, 1.81] for i in range(len(markets))], ['free', 'free', 'free'])

assert results[-1]['soc'][0] < 0.03
assert results[-1]['soc'][0] < 0.03
revenue = 0
for time_k in range(len(results)):
    revenue += sum(results[time_k]['revenue'])
    assert np.isclose(results[time_k]['power_market_downward'], 2.0).all()
    assert np.isclose(results[time_k]['power_market_upward'], 0.0).all()
assert np.isclose(revenue, 1.81 * 60 * 3 * 2)

exit(0)

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
