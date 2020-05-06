
class Config(object):
    """Config of the algorithm
    
    Handles global parameters and data
    """
    def __init__(self,
                planning_horizon = 30,
                soh_update_interval = 24 * 7 * 60, # Weekly
                start_time = '2018-01-01',
                end_time = '2019-01-01',
                tot_timestamps = 300,
                strategy = 0,
                threshold = 1e-2,
                optimizer = 0
            ):
        """Config builder.

        Args:
            planning_horizon (int): planning horizon in minutes.
            soh_update_interval (int): State-of-health update interval in hours.

        """
        self.planning_horizon = planning_horizon
        self.soh_update_interval = soh_update_interval
        self.tot_timestamps = tot_timestamps
        self.strategy = strategy
        self.optimizer = optimizer
        self.threshold = threshold