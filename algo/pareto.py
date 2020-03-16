import numpy as np

class ParetoEfficient(object):
    """Pareto Efficient Algorithm
    
    Calculates IRR and remaining life of ESS, then run the pareto analysis
    """
    def __init__(self, solutions):
        self.solutions = solutions

    def get_battery_life(self, soh):
        #TODO
        return 1

    def get_irr(self, cash_flows):
        #TODO
        return 1

    def get_pareto_filter(self, costs):
        """
        Find the pareto-efficient points
        :param costs: An (n_points, n_costs) array
        :return: A (n_points, ) boolean array, indicating whether each point is Pareto efficient
        """
        is_efficient = np.ones(costs.shape[0], dtype = bool)
        for i, c in enumerate(costs):
            if is_efficient[i]:
                is_efficient[is_efficient] = np.any(costs[is_efficient]>=c, axis=1)
                print(is_efficient[is_efficient] )
                is_efficient[i] = True  # And keep self
        return is_efficient

    def pareto_analysis(self):
        """Run Pareto Analysis

        :return: an inefficient list and an efficient list
        """
        pareto_cost = []
        for sol in self.solutions:
           pareto_cost.append([get_irr(sol[0]), get_battery_life(sol[3])])
        pareto_cost = np.array(pareto_cost)
        efficient_filter = get_pareto_filter(pareto_cost)

        inefficient_list = []
        efficient_list = []
        for e, i in enumerate(efficient_filter):
            if e:
                efficient_list.append(self.solutions[i])
            else:
                inefficient_list.append(self.solutions[i])
                
        return inefficient_list, efficient_list