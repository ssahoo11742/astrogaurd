# Project Exoplaneteers: Astrogaurd

Astrogaurd is a web-based tool designed to help the public understand and explore the risks posed by Near-Earth Objects (NEOs) and how humanity could respond to them. The platform allows users to customize asteroid parameters and observe their potential effects on population, earthquakes, and tsunamis.  

It features a live feed of upcoming close approaches and an interactive 3D visualization that accurately propagates the orbits of all known NEOs. Users can analyze individual asteroids in detail, examining properties like diameter, impact probability, and miss distance, and experiment with mitigation strategies such as kinetic impactors or laser ablation to see their effect on the orbit. The impact analysis tool simulates local consequences, while a built-in game mode challenges users to test their own deflection strategies.  

Astrogaurd makes complex planetary defense concepts accessible, engaging, and educational for everyone.

---

## Project Links
- **Demo Presentation:** [Google Slides](https://docs.google.com/presentation/d/1OALuV7m_crH4yXVZmSo0OavIAKeNDwCutpGgyXwyQQQ/edit?usp=sharing)  
- **Live Project:** [Astrogaurd App](https://astrogaurd.netlify.app/)

---

## Overview
Astrogaurd provides tools and interactive 3D visualizations designed to educate the general public on the dangers of NEOs and how to mitigate them. Users can:

- See localized impact effects such as tsunamis or earthquakes.
- Simulate mitigation strategies like kinetic deflectors and gravity tractors.
- Explore a 3D interactive map of all NEOs with accurate orbit propagation.
- Test asteroid mitigation strategies in a game mode.

---

## Features

### Tooltips
To help users understand scientific terms, tooltips are provided throughout the app. Users can toggle them using the key combination `CTRL+ALT+I`.

### Live Feed
A tracker of the next 6 predicted close approaches via the NASA Sentry API. Provides approach date, diameter, distance, and velocity.

### Glossary
A glossary clarifies NEO terminology and mitigation strategies. Initial content was AI-generated and then vetted by humans.

### Impact Explorer
- Customize parameters of a hypothetical asteroid impact.
- Analyze effects like coastline impact, seismic activity, crater dimensions, and population affected.
- Available in both the home page (custom parameters) and impact analysis section (preset parameters for selected asteroids).

### 3D NEO Visualization
- Interactive 3D render of the Solar System with ~34,000+ NEOs.
- Accurate orbit propagation for 100 years before and after 2000.
- Controls to explore past/future orbits, filter objects, and track Potentially Hazardous Asteroids (PHAs).

### Approach Analysis
- Explore specific NEO close approaches in 3D.
- Visualize orbits, uncertainty (via Monte Carlo simulations), and impact analysis.
- Modify orbits using four methods: Manual, Kinetic Deflector, Gravity Tractor, Laser Ablation.

### Game Mode (Experimental Prototype)
- Available in the Approach Analysis screen.
- Goal: Alter the asteroid’s orbit to achieve a safe miss distance within the set time.
- Adjustable settings include Max/Min Safe Distance, time interval speed, and time step.
- Provides step-by-step guidance during the game.

---

## Benefits
- Visualize NEOs and their orbits around Earth and the Solar System.
- Access scientific information through tooltips and glossary.
- Understand, explore, and visualize mitigation strategies.
- Experience the magnitude of asteroid impacts using the Impact Explorer.
- Engage with planetary defense concepts through an interactive game.

---

## Future Improvements
- Expanded game mode with scoring and smoother experience.
- More complex simulations of seismic activity and tsunamis.
- Accessibility features: colorblind filter, text-to-speech, key controls.
- Enhanced visual effects for immersive experience.

---

## Tools & Technology
**Languages:** JavaScript, HTML, Python, CSS  
**Frameworks & Libraries:** ReactJS, Three.js, Leaflet, FastAPI, Uvicorn, R3F, BeautifulSoup, NumPy  

### AI Usage
- ChatGPT: Initial glossary, tooltips, brainstorming concepts.  
- Claude: Frontend code fixes and UI generation.  

### NASA Data Sources
- NASA SBDB Dataset  
- NASA NEOW API  
- NASA SENTRY API  

### Other Data Sources
- Population Density Overlay (Global Human Settlement Population GeoTIFF)  
- Faultlines Overlay  
- "Is it water?" RapidAPI  
- University of Imperial College Impact Calculator
