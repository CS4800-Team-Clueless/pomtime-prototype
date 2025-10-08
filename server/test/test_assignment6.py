from src.assignment6 import add
from src.assignment6 import squared
from src.assignment6 import get_events

def test_add():
    assert add(15, 25) == 40

def test_squared_numbers(self):
    self.assertEqual(squared(2,3),8)

def test_get_events_on_date():
    assert get_events('9/1/2025') == ['Labor Day']
    assert get_events('10/7/2025') == ['CS4800 Assignment Due']
    assert get_events('12/31/2025') == ['Last Day of Year 2025', 'New Year\'s Eve']
