import mpc_solver

class CyclicCoordinate(object):
    def __init__(self, markets, mpc_solver):
        self.markets = markets
        self.mpc_solver = mpc_solver

        self.markets_price_cyclic_n = {1: {"+": 2,"-": 2},
                                           2: {"+": 2,"-": 2},
                                           3: {"+": 2,"-": 2}}

        self.markets_percentage_cyclic_n = {1: {},
                                            2: {"+": 2,"-": 2},
                                            3: {"+": 2,"-": 2}}

    def run_mpc(self, max_price, percentage):
        results = mpc_solver.solve(prices, percentages)
        revenue = 0
        for time_k in range(len(results)):
            revenue += sum(results[time_k]['revenue'])
        return revenue

    def is_pareto_efficient_simple(self, costs):
        """
        Find the pareto-efficient points
        :param costs: An (n_points, n_costs) array
        :return: A (n_points, ) boolean array, indicating whether each point is Pareto efficient
        """
        is_efficient = np.ones(costs.shape[0], dtype = bool)
        for i, c in enumerate(costs):
            if is_efficient[i]:
                is_efficient[is_efficient] = np.any(costs[is_efficient]<c, axis=1)  # Keep any point with a lower cost
                print(is_efficient[is_efficient] )
                is_efficient[i] = True  # And keep self
        return is_efficient

    # Faster than is_pareto_efficient_simple, but less readable.
    def is_pareto_efficient(self, costs, return_mask = True):
        """
        Find the pareto-efficient points
        :param costs: An (n_points, n_costs) array
        :param return_mask: True to return a mask
        :return: An array of indices of pareto-efficient points.
            If return_mask is True, this will be an (n_points, ) boolean array
            Otherwise it will be a (n_efficient_points, ) integer array of indices.
        """
        is_efficient = np.arange(costs.shape[0])
        n_points = costs.shape[0]
        next_point_index = 0  # Next index in the is_efficient array to search for
        while next_point_index<len(costs):
            nondominated_point_mask = np.any(costs<costs[next_point_index], axis=1)
            nondominated_point_mask[next_point_index] = True
            is_efficient = is_efficient[nondominated_point_mask]  # Remove dominated points
            costs = costs[nondominated_point_mask]
            next_point_index = np.sum(nondominated_point_mask[:next_point_index])+1
        if return_mask:
            is_efficient_mask = np.zeros(n_points, dtype = bool)
            is_efficient_mask[is_efficient] = True
            return is_efficient_mask
        else:
            return is_efficient

    def plot_pareto(self, data):
        optimal_index = self.is_pareto_efficient(data)
        optimal_datapoints = data[optimal_index]

        fig = plt.figure()
        ax = fig.add_subplot(231, projection='3d')
        ax.scatter(data[:, 0], data[:, 1], data[:, 2], marker='^')
        ax.scatter(optimal_datapoints[:, 0], optimal_datapoints[:, 1], optimal_datapoints[:, 2], marker='o')
        
        ax2 = fig.add_subplot(232, projection='3d')
        ax2.scatter(data[:, 0], data[:, 1], data[:, 3], marker='^')
        ax2.scatter(optimal_datapoints[:, 0], optimal_datapoints[:, 1], optimal_datapoints[:, 3], marker='o')

        ax3 = fig.add_subplot(233, projection='3d')
        ax3.scatter(data[:, 1], data[:, 2], data[:, 3], marker='^')
        ax3.scatter(optimal_datapoints[:, 1], optimal_datapoints[:, 2], optimal_datapoints[:, 3], marker='o')
        plt.show()

        # ax4 = fig.add_subplot(234)
        # ax4.scatter(data[:, 0],  data[:, 1], marker='^')
        # ax4.scatter(optimal_datapoints[:, 0], optimal_datapoints[:, 1], marker='o')
    def Algo4(self, percentage):
        set_of_feasible_value = {}
        solutions = []
        for i, market in enumerate(self.markets):
            set_of_feasible_value[i+1] = {"-": {}, "+": {}}
            set_of_feasible_value[i+1]["-"]["max"] = market.max_feasible_selling_price
            set_of_feasible_value[i+1]["-"]["min"] = market.min_feasible_selling_price
            set_of_feasible_value[i+1]["+"]["max"] = market.max_feasible_buying_price
            set_of_feasible_value[i+1]["+"]["min"] = market.min_feasible_buying_price
            
        j = 1
        p = '-'
        #while (p == '-' and config.market[j].max_feasible_selling_price >= config.market[j].min_feasible_selling_price)
        while set_of_feasible_value[j][p]['max'] >= set_of_feasible_value[j][p]['min'] + 2:
            print(j)
            max_price, min_price = set_of_feasible_value[j][p]['max'], set_of_feasible_value[j][p]['min']
            if max_price - min_price >= self.markets_price_cyclic_n[j][p]:
                diff = (max_price - min_price)/self.markets_price_cyclic_n[j][p]
                optimal_price = (0, [], 0, 0, 0, 0)
            
            # calculate each period
                while min_price + diff <= max_price:
                    result = self.dummy_algo3(min_price+diff, percentage)
                    price, profit, SoC, SoH, storage = result
                    if price > optimal_price[0]: optimal_price = (price, [min_price, min_price+diff], profit, SoC, SoH, storage)
                    min_price = min_price+diff
                
                # update optimal period
                set_of_feasible_value[j][p]['min'], set_of_feasible_value[j][p]['max'] = optimal_price[1]
                solutions.append(result)
            else:
                while max_price - min_price < self.markets_price_cyclic_n[j][p]:
                    self.markets_price_cyclic_n[j][p] = self.markets_price_cyclic_n[j][p] - 1
                continue

            # update variables
            if p == '-': p = '+'
            else: p = '-'
            
            if j == self.num_markets: j = 1
            else: j = j + 1

        return np.asarray(solutions).reshape(-1,5)


    def Algo5(self):
        set_of_feasible_value = {}
        solutions = []
        for i, market in enumerate(self.markets):
            set_of_feasible_value[i+1] = {"-": {}, "+": {}}
            set_of_feasible_value[i+1]["-"]["max"] = market.max_feasible_power_output_percentage
            set_of_feasible_value[i+1]["-"]["min"] = market.min_feasible_power_output_percentage
            set_of_feasible_value[i+1]["+"]["max"] = market.max_feasible_power_input_percentage
            set_of_feasible_value[i+1]["+"]["min"] = market.min_feasible_power_input_percentage
        j = 2
        p = '-'
        #while (p == '-' and config.market[j].max_feasible_selling_price >= config.market[j].min_feasible_selling_price)
        while set_of_feasible_value[j][p]['max'] >= set_of_feasible_value[j][p]['min'] + 2:
            max_percentage, min_percentage = set_of_feasible_value[j][p]['max'], set_of_feasible_value[j][p]['min']
            if max_percentage - min_percentage >= self.markets_percentage_cyclic_n[j][p]:
                diff = (max_percentage - min_percentage)/self.markets_percentage_cyclic_n[j][p]
                optimal_price = (0, [], 0, 0, 0, 0)
            
                # calculate each period
                while min_percentage + diff <= max_percentage:
                    solutions.append(self.Algo4(min_percentage+diff))
                    print(np.asarray(solutions).reshape(-1,5).shape)
                    self.plot_pareto(np.asarray(solutions).reshape(-1,5))

                # if price > optimal_price[0]: optimal_price = (price, [min_percentage, min_percentage+diff], profit, SoC, SoH, storage)
                # min_percentage = min_percentage+diff
            
            else:
                while max_percentage - min_percentage < self.markets_percentage_cyclic_n[j][p]:
                    self.markets_percentage_cyclic_n[j][p] = self.markets_percentage_cyclic_n[j][p] - 1
                continue

            # update variables
            if p == '-': p = '+'
            else: p = '-'
            
            if j == self.num_markets: j = 2
            else: j = j + 1
        return solutions