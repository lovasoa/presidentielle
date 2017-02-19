const URL_RESULTS = "https://jsonp.afeld.me/?url=http://www.ifop.fr/rss.php";
const COLORS = {
  "Nathalie ARTHAUD": "#85144b",
  "Philippe POUTOU": "#FF0000",
  "Jean-Luc MELENCHON": "#FF4136",
  "Benoît HAMON": "#01FF70",
  "Yannick JADOT": "#2ECC40",
  "Emmanuel MACRON": "#7FDBFF",
  "François BAYROU": "#FF851B",
  "François FILLON": "#0074D9",
  "Nicolas DUPONT-AIGNAN": "#111111",
  "Marine LE PEN": "#001f3f"
};

function splitResults(str) {
  // Retourne à partir d'une chaîne de caractères une liste de résultats de sondages
  return str.match(/\d+ [a-zé]+ 20\d\d :( - [^:]* : \d+,?\d*%)+/g);
}

function parseResults(text) {
  return splitResults(text)
            .map(parseResult)
            .sort()
}

function parseResult(text) {
  // parse une chaîne de caractères qui contient un résultat de sondage.
  const date = text.match(/\d+ [a-zé]+ 20\d\d/)[0];
  const candidates = text
                  .split(' - ')
                  .slice(1)
                  .map(parseSingleCandidate);

  toString = () => moment(date, 'DD MMMM YYYY', 'fr').toISOString()
  return {date, candidates, toString};
}

function parseSingleCandidate(s) {
  // "Candidat A : 12,3%" => {nom: "Candidat A", score: 12.3}
  const [name, score] = s.split(':');
  return {
    name: name.trim(),
    score: parseFloat(score.replace(',','.'))
  }
}

function makeHistoricGraphData(results) {
  // Transform the data so that is is usable by Chartsjs

  const candidates = results
    .reduce(
      (s,r) => r.candidates.reduce(
        (s,c) => s.add(c.name), s), new Set);

  const labels = results.map(r => r.date);
  const datasets = Array.from(candidates)
    .map(c => ({
          label: c,
          fill: false,
          borderColor: deterministicColor(c),
          backgroundColor: deterministicColor(c),
          pointRadius: 5,
          data: results.map(
            r => (r.candidates.find(cc => cc.name === c) || {}).score)
        })
      );

  return {
    "type": "line",
    data: {labels, datasets},
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Historique des sondages IFOP concernant le premier tour de l’élection présidentielle de 2017'
      },
      scales: {
        xAxes: [{
           type: 'time',
           time: {
            unit: 'day',
            parser: 'DD MMMM YYYY',
            displayFormats: {
              day: 'LL'
            }
           }
        }]
      }
    }
  };
}

function makePieGraphData (results) {
  const last = results[results.length - 1].candidates;
  const labels = last.map(c => c.name);
  const data = last.map(c => c.score);
  const backgroundColor = labels.map(deterministicColor);

  return {
    type: "doughnut",
    data: {
      labels,
      datasets: [{data, backgroundColor}]
    },
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Dernier sondage IFOP concernant le premier tour de l’élection présidentielle de 2017'
      }
    }
  };
}

function deterministicColor(string) {
  return COLORS[string];
}


function makeChart(rawData) {
  return (chartOptions => {
    const ctx = document.getElementById(chartOptions.name + 'Chart').getContext('2d');
    const data = chartOptions.format(rawData);
    return new Chart(ctx, data);
  });
}

function drawGraph(data) {
  moment.locale('fr');
  document.getElementById("loading").hidden = true;
  const charts = [{
    name: 'historic',
    format: makeHistoricGraphData
  }, {
    name: 'pie',
    format: makePieGraphData
  }];
  return charts.map(makeChart(data));
}

function fetchResults() {
  return fetch(URL_RESULTS)
    .then(x => x.text())
    .then(parseResults);
}

function start() {
  return fetchResults().then(drawGraph);
}

window.onload = start;
