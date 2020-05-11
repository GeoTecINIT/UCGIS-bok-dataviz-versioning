# EO4GEO-bok-dataviz-v2

EO4GEO-bok-dataviz-v2 is an script to parse a json-ld file and visualize it in a circle packing d3 layout.

## Installation

Using npm: 

```bash
npm i @eo4geo/find-in-bok-dataviz
```

## Usage

Place a div and give it an id.
If you want to show also the textual information, place a div and give it an id.

```html
<div id="bubbles"> </div>
<div id="textInfo"></div>
```

In Javascript call the function visualizeBOKData( svgID, jsonFile, textID, numVersion, oldVersion)

- svgID : is the id you gave to the element in the HTML you want to display the graph
- jsonFile : is the location of the json file. You can download it from releases
- textID : is the id you gave to the div for the textual information
- numVersion : the number of the current version from database
- oldVersion : the number of an old version from database


```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]
bok.visualizeBOKData('#bubbles', 'assets/saved-bok.json', '#textInfo', 1, null) // will render the graphical view and the textual view from the version 1 in database

```

Other functions

```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]

selectedNodes = bok.searchInBoK(searchText); // returns an array of concepts matching the searchText string

bok.browseToConcept(conceptShortName); // navigates to the concept specified

// Examples
selectedNodes = bok.searchInBoK('Analytics');
bok.browseToConcept('GIST'); // navigates to root concept
bok.browseToConcept('AM'); // navigates to Analytical Methods concept

```


