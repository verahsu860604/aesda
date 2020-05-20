import random
import pandas as pd
import numpy as np


class MarketDataLoader(object):
    """Market data (price and setpoints) loader.  

    """

    def __init__(self, price_data_path=None, setpoint_data_path=None, config = None, setpoint_time_scale = 1, price_time_scale = 60):
        """Market data loader builder.
    
        Args:
            price_data_path(str): 
            setpoint_data_path(str): 
        """
        self.setpoint_time_scale = setpoint_time_scale
        self.price_time_scale = price_time_scale
        self.price_data = None
        self.setpoint_data = None
        if price_data_path is not None:
            self.price_data = pd.read_csv(price_data_path).values
            print("START TIME: ", self.price_data[0][0].replace('.', ':'))
        if setpoint_data_path is not None:
            self.setpoint_data = pd.read_csv(setpoint_data_path).values

    def get_setpoint(self, timestamp):
        """Get setpoint data of given timestamp.

        Args:
            timestamp (int): The time of request.

        Returns:
            time_str (string): Current time.
            setpoint (float) in range [-1, 1]. If < 0 means downward percentage, setpoint > 0 means upward percentage.
        """
        if self.setpoint_data is None:
            return '', None
        timestamp = timestamp // self.setpoint_time_scale
        setpoint = self.setpoint_data[timestamp][1]
        return self.setpoint_data[timestamp][0], setpoint / 50 - 1

    def get_prices(self, timestamp):
        """Get setpoint data of given timestamp.

        Args:
            timestamp (int): The time of request.

        Returns:
            buying_price (float), MO buying price.
            selling_price (float), MO selling price.
        """
        if self.price_data is None:
            return None, None
        timestamp = timestamp // self.price_time_scale
        price1, price2 = self.price_data[timestamp][2], self.price_data[timestamp][1]
        return random.randint(1, 30) if not price1 > 1e-5 else price1, random.randint(100, 400) if not price2 > 1e-5 else price2

class Market(object):
    """Market represents a reserve market (primary, secondary or tertiary)
    
    Handles parameters and market decisions
    """
    def __init__(self,
                name='',
                price_data_path = None,
                setpoint_data_path = None,

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

                upward_penalty = 1,
                downward_penalty = 1

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

            price_data_path (str): Price data path.
            setpoint_data_path (str): setpoint data path.

            upward_penalty (float): upward_penalty.
            downward_penalty (float): downward_penalty.
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

        self.data_loader = MarketDataLoader(price_data_path=price_data_path, setpoint_data_path=setpoint_data_path, setpoint_time_scale=setpoint_interval, price_time_scale=delivery_phase_length)

        # self.phase_length = delivery_phase_length
        self.delivery_length = delivery_phase_length // time_window_in_delivery

        self.price_cyclic_n_upward = price_cyclic_n_upward
        self.price_cyclic_n_downward = price_cyclic_n_downward
        self.percentage_cyclic_n = percentage_cyclic_n

        self.price_cyclic_eps_upward = price_cyclic_eps_upward
        self.price_cyclic_eps_downward = price_cyclic_eps_downward
        self.percentage_cyclic_eps = percentage_cyclic_eps

        self.percentage_fixed = True if percentage_fixed else False

        self.upward_penalty = upward_penalty
        self.downward_penalty = downward_penalty

        # self.test_mode = test_mode
        # if test_mode:
        #     self.debug_data = [-1  for i in range(60)]
        #     # self.debug_data = [-1 if i % 2 == 0 else 1 for i in range(60)]
        #     for i in range(1, 60):
        #         if i % self.setpoint_interval != 0:
        #             self.debug_data[i] = self.debug_data[i - 1]


    def get_setpoint(self, timestamp):
        """Get setpoint data of given timestamp.

        Args:
            timestamp (int): The time of request.

        Returns:
            time_str (str). Time string.
            setpoint (float) in range [-1, 1]. If < 0 means downward percentage, setpoint > 0 means upward percentage.
        """

        # if self.test_mode:
        #     return self.debug_data[timestamp]

        if self.data_loader is None: # No data specified
            # return 0
            return '', random.random() * 2 - 1 # Use random data

        time_str, setpoint = self.data_loader.get_setpoint(timestamp)
        if setpoint is None: # Not Found or error
            # return 0
            return '', random.random() * 2 - 1 # Use random data
        return time_str, setpoint

    def get_market_decision(self, timestamp, prices):
        """Get market decision data of given timestamp and prices.

        Args:
            timestamp (int): The time of request.
            prices (Tuple): Tuple of prices (buying_price, selling_price) (upward and downward)

        Returns:
            decision (str): str in ['both', 'upward', 'downward', 'none']
        """
        # return 'both'
        # if self.test_mode:
        #     return 'both'

        if self.data_loader is None: # No data specified
            return ['both', 'upward', 'downward', 'none'][random.randint(0, 3)] # Use random data

        buying_price, selling_price = self.data_loader.get_prices(timestamp)
        # 0 250
        # 4 0
        # print('DEBUG: Price', buying_price, selling_price)
        # print(prices[0], prices[1])

        if (buying_price is None) or (selling_price is None): # Not Found or error
            return ['both', 'upward', 'downward', 'none'][random.randint(0, 3)] # Use random data

        buying_true = (buying_price > 1e-5 and prices[0] >= buying_price)
        selling_true = (selling_price > 1e-5 and prices[1] <= selling_price)
        if buying_true and selling_true:
            return 'both'
        elif buying_true:
            return 'upward'
        elif selling_true:
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
