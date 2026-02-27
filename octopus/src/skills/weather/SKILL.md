---
name: weather
description: Get weather information for any location
requires:
  bins: [curl]
---

# Weather Skill

Get current weather information and forecasts for any location.

## Usage

### Current Weather

```bash
# Get current weather for a city
curl "http://wttr.in/New York?format=3"

# Get detailed weather information
curl "http://wttr.in/London?format=%l:+%c+%t,+%w+%m"

# Get weather in metric units
curl "http://wttr.in/Paris?format=%l:+%c+%t,+%w+%m&u"

# Get weather in imperial units
curl "http://wttr.in/Tokyo?format=%l:+%c+%t,+%w+%m&us"
```

### Weather Forecast

```bash
# Get 3-day forecast
curl "http://wttr.in/Berlin?format=%l:+%c+%t,+%w+%m&d"

# Get full forecast with graphical symbols
curl "http://wttr.in/Sydney?0"

# Get forecast for specific number of days
curl "http://wttr.in/Toronto?format=%l:+%c+%t,+%w+%m&d&n=5"
```

### Advanced Options

```bash
# Get weather in JSON format
curl "http://wttr.in/Mumbai?format=j1"

# Get weather with moon phase
curl "http://wttr.in/Cairo?format=%l:+%c+%t,+%w+%m&m"

# Get quiet output (no colors)
curl "http://wttr.in/Moscow?format=%l:+%c+%t,+%w+%m&Q"
```

## Format Options

The `format` parameter accepts these placeholders:

- `%l` - Location name
- `%c` - Weather condition
- `%t` - Temperature
- `%w` - Wind
- `%m` - Moonphase
- `%h` - Humidity
- `%p` - precipitation probability

## Examples

```bash
# Simple current weather
curl "http://wttr.in/Seattle?format=3"
# Output: Seattle: ⛅️ +54°F

# Detailed current weather
curl "http://wttr.in/Chicago?format=%l:+%c+%t,+%w+%m"
# Output: Chicago: ☀️ +62°F, ↖️ 4 mph 🌒

# 3-day forecast
curl "http://wttr.in/Boston?format=%l:+%c+%t,+%w+%m&d"
# Output: Boston: ☀️ +68°F, ↙️ 3 mph 🌒
```

## Notes

- The wttr.in service provides weather information worldwide
- No API key is required
- Supports city names, airport codes, and special locations
- Output can be customized with various format options
- Works with IPv4, IPv6, and Tor connections