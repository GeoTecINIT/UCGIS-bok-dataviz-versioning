import * as d3 from "d3";

var Relationtype = {
  SIMILAR: "similarTo",
  PREREQUISITE: "prerequisites",
  POSTREQUISITE: "postrequisites",
  BROADER: "broader",
  NARROWER: "narrower",
  DEMONSTRATES: "demonstrates",
  SUBCONCEPT: "is subconcept of",
  SIMILARTO: "is similar to",
  RELATEDTO: "is related to",
  PREREQUISITEOF: "is prerequisite of"
};

const TEMPLATE_IdGraph = 'graph';
const TEMPLATE_IdText = 'textInfo';
// const TEMPLATE_IdAbs = 'bokabstract';
const TEMPLATE_IdInt = 'bokintroduction';
const TEMPLATE_IdDes = 'bokdescription';
const TEMPLATE_IdRel = 'bokrelations';
const TEMPLATE_IdRef = 'bokreferences';
const TEMPLATE_IdSki = 'bokskills';
const TEMPLATE_IdVer = 'bokversioning';
// const TEMPLATE_IdRelN = 'bokrelationsnum';
const TEMPLATE_IdRefN = 'bokreferencesnum';
const TEMPLATE_IdSkiN = 'bokskillsnum';
const TEMPLATE_IdVerN = 'bokversioningnum';
const TEM_IdKey = 'keywordsInfo';
const TEM_IdKeyT = 'keywordsInfoTitle';



// const TEMPLATE_IdAcc = 'bokaccordion';

const width = 932;
const height = width;
let view;

let codesColors = ['AM', 'CP', 'CV', 'DA', 'DC', 'DM', 'FC', 'GS', 'KE', 'PD', 'UC'];
let colorsHEX = ['#9999F8', '#AEB9C8', '#F19E70', '#4EAEEA', '#FBE7A3', '#B1CF95', '#F19E9C', '#439798', '#E4EEDC', '#A3C1E3', '#e4e4e4'];

let selectedNodes = [];
let allNodes = {};
let rootNodeCode = '';
let fullBoK = {};
let fullParsedBoK = {};
let versionsCodes = [];

let allVersions = [];
let currSelCode = '';
let currVersion = 'current';

const COLOR_STROKE_SELECTED = 'black';
const COLOR_STROKE_DEFAULT = '#090909';
const COLOR_STROKE_RESULTS = '#080808';

export function parseBOKData(bokJSON, v) {
  // loop all nodes
  allNodes[v] = [];
  versionsCodes[v] = [];

  bokJSON.concepts.forEach((n, index) => {
    var node = {
      name: n.name,
      code: n.code,
      introduction: n.introduction,
      description: n.description,
      explanation: n.explanation,
      selfAssesment: n.selfAssesment,
      uri: n.link,
      id: index,
      value: 1,
      children: [],
      parents: [],
      keywords: [],
      demonstrableSkills: [],
      contributors: [],
      sourceDocuments: [],
      relatedTo: []
    };
    allNodes[v].push(node);
    versionsCodes[v].push(n.code.toLowerCase());

  });


  // add children - parent
  bokJSON.relations.forEach(r => {
    if (r.name === Relationtype.SUBCONCEPT) {
      if (r.target != r.source) {
        if (!allNodes[v][r.target].children.includes(allNodes[v][r.source]))
          allNodes[v][r.target].children.push(allNodes[v][r.source]);
        if (!allNodes[v][r.source].parents.includes(allNodes[v][r.target]))
          allNodes[v][r.source].parents.push(allNodes[v][r.target]);
      } 
    } if (r.name === Relationtype.RELATEDTO) {
      if (r.target != r.source) {
        if (!allNodes[v][r.target].relatedTo.includes(allNodes[v][r.source]))
          allNodes[v][r.target].relatedTo.push(allNodes[v][r.source]);
        if (!allNodes[v][r.source].relatedTo.includes(allNodes[v][r.target]))
          allNodes[v][r.source].relatedTo.push(allNodes[v][r.target]);
      }
    }
  });
  // add skills
  bokJSON.skills.forEach(skill => {
    if (skill.concepts && skill.concepts.length > 0) {
      skill.concepts.forEach(skillconcept => {
        allNodes[v][skillconcept].demonstrableSkills.push(skill.name ? skill.name : '');
      });
    }
  });

  // add contributors
  if (bokJSON.contributors) {
    bokJSON.contributors.forEach(con => {
      if (con.concepts && con.concepts.length > 0) {
        con.concepts.forEach(c => {
          allNodes[v][c].contributors.push({
            name: con.name ? con.name : '',
            description: con.description ? con.description : '',
            url: con.url ? con.url : ''
          });
        });
      }
    });
  }

  // add source documents
  bokJSON.references.forEach(ref => {
    if (ref.concepts && ref.concepts.length > 0) {
      ref.concepts.forEach(c => {
        allNodes[v][c].sourceDocuments.push({
          name: ref.name ? ref.name : '',
          description: ref.description ? ref.description : '',
          url: ref.url ? ref.url : ''
        });
      });
    }
  });

  // add keywords documents
  bokJSON.keywords.forEach(ref => {
    if (ref.concepts && ref.concepts.length > 0) {
      ref.concepts.forEach(c => {
        allNodes[v][c].keywords.push({
          name: ref.name ? ref.name : '',
          description: ref.description ? ref.description : '',
          color: ref.color ? ref.color : '#8FBDAF'
        });
      });
    }
  });

  // find root node
  let rootNode;

  for (let i = 0; i < allNodes[v].length; i++) {
    if (allNodes[v][i].parents.length == 0 && allNodes[v][i].children.length > 0) {
      rootNode = allNodes[v][i];
      rootNodeCode = allNodes[v][i].code.toLowerCase();
      break;
    }
  }

  return rootNode;

}
export function getCurrSelCode() {
  return currSelCode;
}

window.getCurrSelCode = getCurrSelCode;

export function browseToConcept(code) {
  if (code) {
    var node = d3.select('#node-' + code.toLowerCase()).data();
    // Can not find the node, find in old versions
    if (node.length == 0) {
      let foundInOld = false;
      let versionToDisplay = 'current';
      allVersions.forEach(v => {
        if (versionsCodes[v].includes(code.toLowerCase())) {
          foundInOld = true;
          versionToDisplay = v;
        }
      });
      // if found in old version
      if (foundInOld) {
        currSelCode = code.toLowerCase();
        visualizeBoKVersion(versionToDisplay);
        displayMsgObsoleteV(code, versionToDisplay);
        // else navigate to root and show error
      } else {
        navigateToRoot();
        if (code.length > 0) {
          displayError(code);
        }
      }

    } else {
      zoom(node[0]);
      displayConcept(node[0]);
    }
  } else {
    navigateToRoot();
  }
}
window.browseToConcept = browseToConcept;
window.searchInBoKKeyword = searchInBoKKeyword;

export function zoomToCode(code) {
  var node = d3.select('#node-' + code.toLowerCase()).data();
  if (node.length > 0) {
    zoom(node[0]);
  }
}
window.zoomToCode = zoomToCode;

export async function getBoKData(url) {
  return new Promise(resolve => {
    d3.json(url + '.json ').then((bok, error) => {
      fullBoK = bok;
      resolve('BoK Loaded - resolve');
      if (error) throw error;
    });
  });
}

export function visualizeBoKVersion(version) {

  currVersion = version;

  var bokData = fullParsedBoK[version];

  var pack = data => d3.pack()
    .size([width, height])
    .padding(3)
    (d3.hierarchy(bokData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value));

  var root = pack(bokData);

  let focus = root;

  d3.select('#' + TEMPLATE_IdGraph)
    .select("svg").selectAll("circle").remove();
  d3.select('#' + TEMPLATE_IdGraph)
    .select("svg").selectAll("text").remove();

  const svg = d3.select('#' + TEMPLATE_IdGraph)
    .select("svg")
    .on("click", () => zoom(root));

  const node = svg.append("g")
    .selectAll("circle")
    .data(root)
    .join("circle")
    .attr("fill", d => {
      let code = codesColors.indexOf(d.data.code.substring(0, 2));
      return colorsHEX[code];
    })
    .attr("stroke", COLOR_STROKE_DEFAULT)
    .attr("stroke-width", "0.2px")
    .attr("id", d => "node-" + d.data.code.toLowerCase())
    .on("click", (event, d) => {
      if (focus !== d) {
        event.currentTarget.style.stroke = COLOR_STROKE_SELECTED;
        zoom(d);
        displayConcept(d);
      }
      event.stopPropagation();
    }).on("mouseover", function (d) {
      if (this.attributes.stroke.value === COLOR_STROKE_DEFAULT) this.style.strokeWidth = 1
    })
    .on("mouseleave", function (d) {
      if (this.attributes.stroke.value === COLOR_STROKE_DEFAULT) this.style.strokeWidth = 0.2
    });

  const label = svg.append("g")
    .style("font", "12px sans-serif")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill-opacity", d => d.parent === root ? 1 : 0)
    .style("display", d => d.parent === root ? "inline" : "none")
    .each(function (d) { //This function inserts a label and adds linebreaks, avoiding lines > 13 characters
      var arr = d.data.name.split(' '),
        maxLabelLength = 13,
        final = [arr[0]];
      for (var i = 1, j = 0; i < arr.length; i++) {
        (final[j].length + arr[i].length < maxLabelLength) ? final[j] += ' ' + arr[i] : (j++, final[j] = arr[i]);
      }
      final.forEach((t, i) => d3.select(this).append('tspan').text(t).attr('dy', i ? '1em' : -0.5 * (j - 1) + 'em').attr('x', 0).attr('text-anchor', 'middle').attr('class', 'tspan' + i));
    })

  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];
    view = v;

    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(d) {
    const focus0 = focus;
    focus = d;

    const transition = svg.transition()
      .duration(1000)
      .tween("zoom", d => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
      });

    label
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline" || (d === focus && (d.children == null || d.children == []));
      })
      .transition(transition)
      .style("fill-opacity", function (d) {
        return d.parent === focus || (d === focus && (d.children == null || d.children == [])) ? 1 : 0;
      })
      .on("start", function (d) {
        if (d.parent === focus || (d === focus && (d.children == null || d.children == [])))
          this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus && (d !== focus && (d.children == null || d.children == [])))
          this.style.display = "none";
      });

  }

  window.zoom = zoom;
  browseToConcept(currSelCode);

}

window.visualizeBoKVersion = visualizeBoKVersion;


export async function visualizeBOKData(url, version) {

  await getBoKData(url);
  allVersions = Object.keys(fullBoK);

  // Sort all Versions chronollogically  - current first one
  allVersions.sort((a, b) => {
    if (a == 'current')
      return -1;
    else if (b == 'current')
      return 1;
    else
      return parseInt(b.split('v')[1]) - parseInt(a.split('v')[1]);
  });

  console.log("ALL VERSIONS " + allVersions)

  allVersions.forEach(v => {
    fullParsedBoK[v] = parseBOKData(fullBoK[v], v);
  });

  d3.select('#' + TEMPLATE_IdGraph)
    .append("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .style("display", "block")
    .style("cursor", "pointer");

  visualizeBoKVersion(version);

}

export function searchInBoK(string, searchCode, searchName, searchKey, searchDes, searchSkills, searchSD) {
  cleanSearchInBOK();
  cleanTextInfo();

  let searchInputFieldDoc = string.trim().toLowerCase();
  if (searchInputFieldDoc != "" && searchInputFieldDoc != " ") {

    let results = allNodes[currVersion].filter((n) => {
      let filterBool = searchCode && n.code.toLowerCase().includes(searchInputFieldDoc) ||
        searchName && n.name.toLowerCase().includes(searchInputFieldDoc) ||
        searchDes && n.description.toLowerCase().includes(searchInputFieldDoc);

      // search for coincidences in keywords
      if (searchKey && !filterBool) {
        n.keywords.forEach(s => {
          if (s.name.toLowerCase().includes(searchInputFieldDoc)) {
            filterBool = true;
          }
        });
      }
      // search for coincidences in demonstrableSkills
      if (searchSkills && !filterBool) {
        n.demonstrableSkills.forEach(s => {
          if (s.toLowerCase().includes(searchInputFieldDoc)) {
            filterBool = true;
          }
        });
      }
      if (searchSD && !filterBool) {
        n.sourceDocuments.forEach(s => {
          if (s.name.toLowerCase().includes(searchInputFieldDoc)) {
            filterBool = true;
          }
        });

      }
      return filterBool;
    });

    results.forEach(n => {
      d3.select('#node-' + n.code.toLowerCase())
        .attr("stroke-width", "2px")
        .attr("stroke", COLOR_STROKE_RESULTS);
    });

    selectedNodes = results;

    return selectedNodes;
  } else {
    browseToConcept(rootNodeCode);
    // navigateToRoot();
    return [];
  }
}

export function searchInBoKKeyword(string) {
  cleanSearchInBOK();
  cleanTextInfo();

  let searchInputFieldDoc = string.trim().toLowerCase();
  if (searchInputFieldDoc != "" && searchInputFieldDoc != " ") {


    let results = allNodes[currVersion].filter((n) => {
      let filterBool = false;
      // search for coincidences in keywords
      n.keywords.forEach(s => {
        if (s.name.toLowerCase().includes(searchInputFieldDoc.toLowerCase())) {
          filterBool = true;
        }
      });
      return filterBool;
    });

    results.forEach(n => {
      d3.select('#node-' + n.code.toLowerCase())
        .attr("stroke-width", "2px")
        .attr("stroke", COLOR_STROKE_RESULTS);
    });

    selectedNodes = results;

    return selectedNodes;
  } else {
    browseToConcept(rootNodeCode);
    // navigateToRoot();
    return [];
  }
}

export function cleanSearchInBOK() {
  //clean search
  selectedNodes.forEach(n => {
    d3.select('#node-' + n.code.toLowerCase())
      .attr("stroke-width", "0.2px")
      .attr("stroke", COLOR_STROKE_DEFAULT);
  });
  selectedNodes = [];
}

export function navigateToRoot() {
  console.log("Navigate to root");
  const root = d3.select('#node-' + rootNodeCode);
  displayConcept(root.data()[0]);
}

window.navigateToRoot = navigateToRoot;

export function cleanTextInfo() {
  var mainNode = document.getElementById(TEMPLATE_IdText)
  mainNode.innerHTML = "";
}

export function displayError(code) {
  console.log("Concept does not exists");
  var mainNode = document.getElementById(TEMPLATE_IdText);
  mainNode.innerHTML = "<p style='color:#c60606;'> Concept " + code + " does not exist. Use the links or the graph to navigate to a valid one. </p> " + mainNode.innerHTML;
}

export function displayMsgObsoleteV(code, version) {
  console.log("Warning, this is an old version of the Concept exists in older version, " + code + " version " + version);
  var mainNode = document.getElementById(TEMPLATE_IdText);
  if (!mainNode.innerHTML.includes('Warning: this is an obsolete BoK concept'))
    mainNode.innerHTML = "<p style='color:#c60606;'> Warning: this is an obsolete BoK concept - this concept is no longer present in the <a style='color: #007bff; font-weight: 400; cursor: pointer;' onclick='navigateToRoot(); visualizeBoKVersion(\"current\")' >current</a> version. </p> " + mainNode.innerHTML;
}

export function displayMsgOldV() {
  console.log("Warning, this is an old version the Bok ");
  var mainNode = document.getElementById(TEMPLATE_IdText);
  mainNode.innerHTML = "<p style='color:orange'> Warning: this is an old version of this BoK concept; see “\Versioning”\ below for more recent version(s) </p> " + mainNode.innerHTML;
}

//displays all available content for the currently focussed concept in the description box:
export function displayConcept(d) {
  currSelCode = d.data.code.toLowerCase();
  var mainNode = document.getElementById(TEMPLATE_IdText)
  mainNode.innerHTML = "";

  var titleNode = document.createElement("h1");
  titleNode.id = "boktitle";
  titleNode.innerHTML = "[" + d.data.code + "] " + d.data.name; //display Name and shortcode of concept:

  window.history.pushState({}, "Find In Bok", "/" + d.data.code);

  // `<h2>Superconcept:</h2><div id='bokParentNode'><a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-${d.parent.data.code}' onclick='browseToConcept(\"${d.parent.data.code}\")'>[${d.parent.data.code}] ${d.parent.data.name}</a> </div><br>`

  var pNode = document.createElement("p");
  var iconCopy = '&nbsp;&nbsp;<i class=&#39;material-icons&#39;>content_copy</i> Copy';

  pNode.innerHTML = `Permalink: <a href= 'https://gistbok-topics.ucgis.org/${d.data.code}' target='blank'> <i class="material-icons">open_in_new</i> https://gistbok-topics.ucgis.org/${d.data.code}</a> <a id='permalink' style='color: #007bff; font-weight: 400; cursor: pointer;' onclick='navigator.clipboard.writeText(\"https://gistbok-topics.ucgis.org/${d.data.code}\");  document.getElementById("permalink").innerHTML = "&nbsp;&nbsp;Copied!"; '>&nbsp;&nbsp; <i class='material-icons'>content_copy</i> Copy </a>`;

  mainNode.appendChild(pNode);

  mainNode.appendChild(titleNode);

  var lNode = document.createElement("p");
  if (d.data.uri) {
    /*  <a id='urilink' style='color: #007bff; font-weight: 400; cursor: pointer;' onclick='navigator.clipboard.writeText("${d.data.uri}"); document.getElementById("urilink").innerHTML = "&nbsp;&nbsp;Copied!"; document.getElementById("permalink").innerHTML = "${iconCopy}"'>&nbsp;&nbsp; <i class='material-icons'>content_copy</i> Copy </a> */
    lNode.innerHTML = `<a href= '${d.data.uri}' target='blank' style="font-size: smaller">  View this topic in the Living Textbook tool.<i class="material-icons">open_in_new</i></a>`;
  }
  mainNode.appendChild(lNode);


  var keyNode = document.getElementById(TEM_IdKeyT);
  keyNode.innerHTML = '';

  //clean previous keywords
  Array.from(Array(15).keys()).forEach(i => {
    var keyNode = document.getElementById(TEM_IdKey + '' + i);
    keyNode.innerHTML = '';
  })

  if (d.data.keywords.length > 0) {
    var keyNode = document.getElementById(TEM_IdKeyT);
    keyNode.style['font-style'] = 'italic';
    var txt = '<span style="font-weight: 600;" >Keywords: </span>';
    keyNode.innerHTML = txt;

    d.data.keywords.forEach((k, i) => {
      var keyNode = document.getElementById(TEM_IdKey + '' + i);
      keyNode.style['font-style'] = 'italic';
      keyNode.innerHTML = k.name;
    })
  }

  var absNode = document.createElement("p");
  // var absNode = document.getElementById(TEMPLATE_IdAbs);
  //display description of concept
  // var descriptionNode = document.createElement("div");
  if (d.data.description != null && d.data.description != ' ') {
    var currentTxt = "<div id='bokCurrentDescription'>" + d.data.description + "</div>";
    absNode.innerHTML = currentTxt;
  } else
    absNode.innerHTML = "<No short description available>";

  mainNode.appendChild(absNode);

  var absNode = document.getElementById(TEMPLATE_IdInt);

  //display intro of concept
  var intNode = document.getElementById(TEMPLATE_IdInt);
  // var contentNode = document.createElement("div");
  if (d.data.introduction != null && d.data.introduction != " ") {
    var currentTxt = "<div id='bokCurrentContentIntr'>" + d.data.introduction + "</div><br>";
    intNode.innerHTML = currentTxt;
  } else
    intNode.innerHTML = "";

  //display content of concept
  var desNode = document.getElementById(TEMPLATE_IdDes);
  if (d.data.explanation != null && d.data.explanation != " ") {
    var cleanExpl = d.data.explanation.replaceAll('<li><a href="#', '<li><a id="#a')
    var currentTxt = "<div id='bokCurrentContent'>" + cleanExpl + "</div><br>";
    desNode.innerHTML = currentTxt;
  } else
    desNode.innerHTML = "No content available";

  //display relations of concept
  var relNode = document.getElementById(TEMPLATE_IdRel);
  if (d.parent != null) {
    var currentTxt = `<h2>Supertopic:</h2><div id='bokParentNode'><a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-${d.parent.data.code}' onclick='browseToConcept(\"${d.parent.data.code}\")'>[${d.parent.data.code}] ${d.parent.data.name}</a> </div><br>`;
    relNode.innerHTML = currentTxt;
  } else {
    relNode.innerHTML = "";
  }

  //display subconcepts (if any):
  d.data.children && d.data.children.length > 0 && d.data.code == 'UCGIS' ? displayChildren(d.data.children, relNode, "Knowledge areas") : null;
  d.data.children && d.data.children.length > 0 && d.data.code != 'UCGIS' ? displayChildren(d.data.children, relNode, "Subtopics") : null;

  // display related relation
  d.data.relatedTo && d.data.relatedTo.length > 0 ? displayChildren(d.data.relatedTo, relNode, "Related topics") : null;

  //display skills of concept
  var skillNode = document.getElementById(TEMPLATE_IdSki);
  var skillNodeN = document.getElementById(TEMPLATE_IdSkiN);
  skillNode.innerHTML = "";
  skillNodeN.innerHTML = "&nbsp; [" + d.data.demonstrableSkills.length + "]";
  d.data.demonstrableSkills && d.data.demonstrableSkills.length > 0 ? displayTextList(d.data.demonstrableSkills, skillNode, "Learning Objectives") : null;

  //display refs of concept
  var refsNode = document.getElementById(TEMPLATE_IdRef);
  var refsNNode = document.getElementById(TEMPLATE_IdRefN);
  refsNode.innerHTML = "";
  refsNNode.innerHTML = "&nbsp; [" + d.data.sourceDocuments.length + "]";
  d.data.sourceDocuments && d.data.sourceDocuments.length > 0 ? displayLinksList(d.data.sourceDocuments, refsNode, "References", "boksource") : null;

  //display versions of concept
  var verNode = document.getElementById(TEMPLATE_IdVer);
  var verNNode = document.getElementById(TEMPLATE_IdVerN);
  verNode.innerHTML = "";
  verNNode.innerHTML = "&nbsp; [" + allVersions.length + "]";
  // display versions
  displayVersions(verNode, d.data.code);


  // show warnings if concept is obsolete and old version
  if (currVersion != 'current') {
    if (!versionsCodes['current'].includes(d.data.code.toLowerCase())) {
      displayMsgObsoleteV(d.data.code, currVersion);
    } else {
      displayMsgOldV();
    }
  }

};

//displays a list of nodes such as children
export function displayChildren(array, domElement, headline) {
  array.sort((a, b) => a.code.localeCompare(b.code));
  var text = "<h2>" + headline + " [" + array.length + "] </h2><div><ul>";
  array.forEach(c => {
    text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-" + c.code + "' onclick='browseToConcept(\"" + c.code + "\")'>[" + c.code + '] ' + c.name + "</a> <br>";
  });
  text += "</ul></div>";
  domElement.innerHTML += text;
};

// displays links such as contributors and sourceDocuments
export function displayLinksList(array, domElement, headline, id) {
  var text = "<ul>";
  array.forEach(l => {
    text += "<li>" + l.name + " </li>";
  });
  text += "</ul></div>";
  domElement.innerHTML += text;
};

// displays list such as skills
export function displayTextList(array, domElement, headline) {
  var text = "<ul>";
  array.forEach(l => {
    text += "<li>" + l + "</li>";
  });
  text += "</ul></div>";
  domElement.innerHTML += text;
};

// displays list such as skills
export function displayVersions(domElement, conceptCode) {
  var text = "";
  allVersions.forEach(v => {

    if (versionsCodes[v].includes(conceptCode.toLowerCase())) {
      if (v == currVersion) // if current version is the same, make it not clickable
        text += `<li> <strong> <i class="material-icons">east</i> You are viewing: ${v} (${fullBoK[v].updateDate})</strong></li>`;
      else
        text += `<li> <a style='color: #007bff; font-weight: 400; cursor: pointer;' onclick='visualizeBoKVersion(\"${v}\")' >${v} (${fullBoK[v].updateDate})</a></li>`;
    } else {
      text += `<li> ${v} (${fullBoK[v].updateDate}) (Concept does not exist in this version)</li>`;
    }

  });
  text += "</ul></div>";
  domElement.innerHTML += text;
};