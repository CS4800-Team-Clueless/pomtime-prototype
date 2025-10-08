from src.assignment6 import add
from src.assignment6 import squared
from src.assignment6 import get_events
from src.assignment6 import gacha_tenfold

def test_add():
    assert add(15, 25) == 40

def test_squared_numbers():
    assert squared(2, 3) == 8

def test_get_events_on_date():
    assert get_events('9/1/2025') == ['Labor Day']
    assert get_events('10/7/2025') == ['CS4800 Assignment Due']
    assert get_events('12/31/2025') == ['Last Day of Year 2025', 'New Year\'s Eve']

def test_gacha_tenfold():
    result = gacha_tenfold()
    assert len(result) == 10
    for r in result:
        assert r in ["3 star", "4 star", "5 star!"]