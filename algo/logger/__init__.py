import threading
import datetime
import time

from loguru import logger as loguru_logger


def section(name="", value=""):
    return "[{0}={1}]".format(name, value)


class Logger(threading.Thread):

    def __init__(self):
        super(Logger, self).__init__(target=self.run_recent_log_by_hour)
        self._stop_event = threading.Event()
        self.logger = loguru_logger
        self.logger.add("log/all.log", rotation="2 GB")
        self.info = self.logger.info
        self.error = self.logger.error
        self.warning = self.logger.warning
        self.log_recent_hour = datetime.datetime.now().strftime("%Y-%m-%d_%H")
        self.log_handler = self.logger.add("log/log_" + self.log_recent_hour + ".log")
        self.start()

    def stop(self):
        self._stop_event.set()

    def run_recent_log_by_hour(self):
        while True:
            if self._stop_event.is_set():
                break
            hour_time_str = datetime.datetime.now().strftime("%Y-%m-%d_%H")
            if hour_time_str != self.log_recent_hour:
                self.logger.remove(self.log_handler)
                self.log_recent_hour = hour_time_str
                self.log_handler = self.logger.add("log/log_" + self.log_recent_hour + ".log")
            time.sleep(10)


logger = Logger()
