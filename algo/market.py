import random
import pandas as pd
import numpy as np


class MarketDataLoader(object):
    """Market data (price and setpoints) loader.  

    """

    def __init__(self, price_data_path=None, setpoint_data_path=None, config = None):
        """Market data loader builder.
    
        Args:
            price_data_path(str): 
            setpoint_data_path(str): 
        """
        assert (price_data_path is not None) and (setpoint_data_path is not None), 'No data file specified'
        self.price_data = pd.read_csv(price_data_path)
        self.setpoint_data = pd.read_csv(setpoint_data_path)


    def get_setpoint(self, timestamp):
        """Get setpoint data of given timestamp.

        Args:
            timestamp (int): The time of request.

        Returns:
            setpoint (float) in range [-1, 1]. If < 0 means downward percentage, setpoint > 0 means upward percentage.
        """
        setpoint = self.setpoint_data[timestamp]
        return setpoint / 50 - 1

    def get_prices(self, timestamp):
        """Get setpoint data of given timestamp.

        Args:
            timestamp (int): The time of request.

        Returns:
            buying_price (float), MO buying price.
            selling_price (float), MO selling price.
        """

        return self.price_data[timestamp]

class Market(object):
    """Market represents a reserve market (primary, secondary or tertiary)
    
    Handles parameters and market decisions
    """
    def __init__(self,
                time_window_in_delivery = 4,
                setpoint_interval = 1,
                planning_phase_length = 20,
                selection_phase_length = 20,
                schedule_phase_length = 20,
                delivery_phase_length = 20,

                min_feasible_selling_price = 0,
                max_feasible_selling_price = 20,
                min_feasible_buying_price = 0,
                max_feasible_buying_price = 10,

                max_feasible_power_percentage = 20,
                min_feasible_power_percentage = 0,

                price_cyclic_n_upward = 2,
                price_cyclic_n_downward = 2,
                percentage_cyclic_n = 2,
                price_cyclic_eps_upward = 5,
                price_cyclic_eps_downward = 5,
                percentage_cyclic_eps = 5,
                percentage_fixed = False,

                data_loader = None,
                test_mode = False
            ):
        """Market builder.0;.p

        Args:
            time_window_in_delivery (int): Number of time windows in delivery phase.
            setpoint_interval (int): Set-point update interval in minutes
            planning_phase_length (int): planning phase length, in minutes.
            selection_phase_length (int): selection phase length, in minutes.
            schedule_phase_length (int): schedule phase length, in minutes.
            delivery_phase_length (int): delivery phase length, in minutes.

            max_feasible_selling_price (int): Max feasible selling price.
            min_feasible_selling_price (int): Min feasible selling price.
            max_feasible_buying_price (int): Max feasible buying price.
            min_feasible_buying_price (int): Min feasible buying price.

            max_feasible_power_percentage (int): Max feasible Power percentage.
            min_feasible_power_percentage (int): Min feasible Power percentage.

            data_loader (MarketDataLoader): Market data loader.
        """
        self.time_window_in_delivery = time_window_in_delivery
        self.setpoint_interval = setpoint_interval
        self.planning_phase_length = planning_phase_length
        self.selection_phase_length = selection_phase_length
        self.schedule_phase_length = schedule_phase_length
        self.delivery_phase_length = delivery_phase_length

        self.max_feasible_selling_price = max_feasible_selling_price
        self.min_feasible_selling_price = min_feasible_selling_price
        self.max_feasible_buying_price = max_feasible_buying_price
        self.min_feasible_buying_price = min_feasible_buying_price

        self.max_feasible_power_percentage = max_feasible_power_percentage
        self.min_feasible_power_percentage = min_feasible_power_percentage

        self.is_fixed = False # Temporary storage
        self.power_percentage = 10 # Temporary storage

        self.data_loader = data_loader

        self.phase_length = delivery_phase_length
        self.delivery_length = delivery_phase_length // time_window_in_delivery

        self.price_cyclic_n_upward = price_cyclic_n_upward
        self.price_cyclic_n_downward = price_cyclic_n_downward
        self.percentage_cyclic_n = percentage_cyclic_n

        self.price_cyclic_eps_upward = price_cyclic_eps_upward
        self.price_cyclic_eps_downward = price_cyclic_eps_downward
        self.percentage_cyclic_eps = percentage_cyclic_eps

        self.percentage_fixed = percentage_fixed

        self.test_mode = test_mode
        if test_mode:
            self.debug_data = [-1  for i in range(60)]
            # self.debug_data = [-1 if i % 2 == 0 else 1 for i in range(60)]
            for i in range(1, 60):
                if i % self.setpoint_interval != 0:
                    self.debug_data[i] = self.debug_data[i - 1]


    def get_setpoint(self, timestamp):
        """Get setpoint data of given timestamp.

        Args:
            timestamp (int): The time of request.

        Returns:
            setpoint (float) in range [-1, 1]. If < 0 means downward percentage, setpoint > 0 means upward percentage.
        """

        if self.test_mode:
            return self.debug_data[timestamp]

        if self.data_loader is None: # No data specified
            return random.random() * 2 - 1 # Use random data

        setpoint = self.data_loader.get_setpoint(timestamp)
        if setpoint is None: # Not Found or error
            return random.random() * 2 - 1 # Use random data
        return setpoint

    def get_market_decision(self, timestamp, prices):
        """Get market decision data of given timestamp and prices.

        Args:
            timestamp (int): The time of request.
            prices (Tuple): Tuple of prices (buying_price, selling_price) (upward and downward)

        Returns:
            decision (str): str in ['both', 'upward', 'downward', 'none']
        """

        if self.test_mode:
            return 'both'

        if self.data_loader is None: # No data specified
            return ['both', 'upward', 'downward', 'none'][random.randint(0, 3)] # Use random data

        buying_price, selling_price = self.data_loader.get_prices(timestamp)

        if (buying_price is None) or (selling_price is None): # Not Found or error
            return ['both', 'upward', 'downward', 'none'][random.randint(0, 3)] # Use random data

        if prices[0] >= buying_price and prices[1] <= selling_price:
            return 'both'
        elif prices[0] >= buying_price and prices[1] > selling_price:
            return 'upward'
        elif prices[0] < buying_price and prices[1] <= selling_price:
            return 'downward'
        else:
            return 'none'
  
    def update_percentage(self, percentage = 10, is_fixed = False):
        """Temporarily store market percentage and fixed.

        Args:
            percentage (int): power percentage
            is_fixed (bool): is the market fixed?

        """
        self.power_percentage = percentage
        self.is_fixed = is_fixed
