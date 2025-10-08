# temporary test db
calendar = [
                {
                    'date': '9/5/2025',
                    'event': 'Assignment Due'
                },
                {
                    'date': '8/21/2025',
                    'event': 'First Day of School'
                },
                {
                    'date': '9/1/2025',
                    'event': 'Labor Day'
                },
                {
                    'date': '10/7/2025',
                    'event': 'CS4800 Assignment Due'
                },
                {
                    'date': '10/10/2025',
                    'event': 'Assignment Due'
                },
                {
                    'date': '9/30/2025',
                    'event': 'Assignment Due'
                },
                {
                    'date': '12/31/2025',
                    'event': 'Last Day of Year 2025'
                },
                {
                    'date': '12/31/2025',
                    'event': 'New Year\'s Eve'
                }
            ]

def add(a, b):
    sum = a + b
    return sum

def squared(c,d):
    return pow(c,d)

def get_events(date):
    events = []
    for event in calendar:
        if (date == event.get('date')):
            events.append(event.get('event'))
    return events
