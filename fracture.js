//TODO: fix when zipcode or country has no companies

var config = {
	zoom: .95,
	timeline: {
		timer: null,
		width: 1100,
		barWidth: 6,
		// TODO: Update this and remove this "magic" constant for the width '1100'
		xScale: d3.scale.linear().domain([1880,2014]).range([20, 950])
	}
}

var global = {
	city1:null,
	geojson1: null,
	city2:null,
	geojson2:null,
	usMapWidth:2400,
	usMapHeight:2400,
	max:200000,
	maxIncome:999999999,
	gradientStart:"#fff",
	gradientEnd:"#eee",
	scale:150000,
	center:[-74.15, 40.9]
	
}
$(function() {
	queue()
		.defer(d3.json, geojson1)
		.defer(d3.csv, csv1)
		.defer(d3.json,overlap)
		.await(dataDidLoad);
})

function dataDidLoad(error, geojson1, city1, overlap) {
	global.city1 = city1
	global.geojson1 = geojson1
	initNycMap(geojson1, city1, "Median", "#svg-1",0,global.maxIncome*100000)
	drawDifferencesJson(city1,"#svg-1",overlap)
}

function drawChart(data, svg, svgNumber){
	//console.log(data)
	//console.log(sumEachColumnChartData(data,"a"))
	var keys = ["Less than $10,000","$10,000 to $14,999","$15,000 to $19,999","$20,000 to $24,999","$25,000 to $29,999","$30,000 to $34,999","$35,000 to $39,999","$40,000 to $44,999","$45,000 to $49,999","$50,000 to $59,999","$60,000 to $74,999","$75,000 to $99,999","$100,000 to $124,999","$125,000 to $149,999","$150,000 to $199,999","$200,000 or more"]
	var max = 0
	var chartData = {}
	var chartDataArray = []
	var total = 0
	for(var key in keys){
		columnSum = sumEachColumnChartData(data,keys[key])
		
		if(columnSum>max){
			max = columnSum
		}
		chartData[keys[key]]=columnSum
		total += columnSum
		chartDataArray.push(columnSum)
	}
	
	var height = 280
	var width = 500
	var margin = 150
	var barWidth = 25
	var barGap = 2
	var svg = d3.select(svg)
		.append("svg").attr("height",height).attr("width",width)
	var yScale = d3.scale.linear().domain([0,max/total*100.0]).range([5,height-margin])
	var chart = svg.selectAll("rect")
		.data(keys)
		.enter()
		.append("rect")
		.attr("x",function(d,i){
			return i*(barWidth+barGap)+20
		})
		.attr("y",function(d){
			var value = chartData[d]
			var percentage = parseInt(value/total*100.0)
			return height-yScale(percentage)-margin
		})
		.attr("width",barWidth)
		.attr("height",function(d){
			var value = chartData[d]
			var percentage = parseInt(value/total*100.0)
			return yScale(percentage)
		})
		.attr("fill","#000")
		.attr("opacity",0.6)
		.on("mouseover",function(d){
			var value = chartData[d]
			var label = d
			var percentage = parseInt(value/total*100.0)
		})
		.on("click",function(d){
			//global.max = 100
			//console.log(d)
			//renderNycMap(global.city1, d, "#svg-1",0, global.maxIncome)
			//renderNycMap(global.city2, d, "#svg-2",0, global.maxIncome)
		})
		
	svg.selectAll("text")
		.data(keys)
		.enter()
		.append("text")
		.attr("class","chartLabel")
		.text(function(d){
			return d
		})
		.attr("x",function(d,i){
			return i*(barWidth+barGap)+20+10
		})
		.attr("y",height-margin+5)
		.attr("text-anchor","start")
		
	svg.selectAll(".percentLabel")
		.data(keys)
		.enter()
		.append("text")
		.attr("class","percentLabel")
		.text(function(d){
			var value = chartData[d]
			var label = d
			var percentage = parseInt(value/total*100)
			return percentage+"%"
		})
		.attr("x",function(d,i){
			return i*(barWidth+barGap)+20+2
		})
		.attr("y",function(d,i){
			var value = chartData[d]
			var percentage = parseInt(value/total*100)
			return height-yScale(percentage)-margin+10
		})
		.attr("text-anchor","center")
			
	svg.append("text")
		.attr("class","axisLabel")
		.text("Income Distribution")
		.attr("x",margin)
		.attr("y",height)
}
function getSizeOfObject(obj){
    var size = 0, key;
     for (key in obj) {
         if (obj.hasOwnProperty(key)) size++;
     }
     return size;
}
function sumEachColumnChartData(data,column){
	//console.log(data)
	//console.log(data)
	var groupLength = getSizeOfObject(data)
	var sum = 0
	for(var i =0; i<groupLength; i++){
		//var columns = getSizeOfObject(data[i])
		var columnValue = parseInt(data[i][column])
		sum += columnValue
	}
	return sum
}
function redrawFilteredMaps(low,high){
	d3.select("#chart1 svg").remove()
	d3.select("#chart2 svg").remove()
	
	var filtered1 = filterData(global.city1,low,high)
	renderNycMap(global.city1, "Median", "#svg-1", low,high)
	drawChart(filtered1,"#chart1",1)
	
	renderNycMap(global.city2, "Median", "#svg-2",low,high)
	var filtered2 = filterData(global.city2,low,high)
	drawChart(filtered2,"#chart2",2)
	
	d3.select(".filterHighlight").remove()
		
	var y = d3.scale.linear().range([0,400]).domain([0,global.max]);
	d3.select("#income-label").html("Showing locations with median household income between $"+low+" and $"+high)
}
var currentSelection = {
	zipcode: null,
	jurisdiction: null
}
var utils = {
	range: function(start, end) {
		var data = []

		for (var i = start; i < end; i++) {
			data.push(i)
		}

		return data
	}
}
var table = {
	group: function(rows, fields) {
		var view = {}
		var pointer = null

		for(var i in rows) {
			var row = rows[i]

			pointer = view
			for(var j = 0; j < fields.length; j++) {
				var field = fields[j]

				if(!pointer[row[field]]) {
					if(j == fields.length - 1) {
						pointer[row[field]] = []
					} else {
						pointer[row[field]] = {}
					}
				}

				pointer = pointer[row[field]]
			}

			pointer.push(row)
		}

		return view
	},

	maxCount: function(view) {
		var largestName = null
		var largestCount = null

		for(var i in view) {
			var list = view[i]

			if(!largestName) {
				largestName = i
				largestCount = list.length
			} else {
				if(list.length > largestCount) {
					largestName = i
					largestCount = list.length
				}
			}
		}

		return {
			name: largestName,
			count: largestCount
		}
	},

	filter: function(view, callback) {
		var data = []

		for(var i in view) {
			var list = view[i]
			if(callback(list, i)) {
				data = data.concat(list)
			}
		}

		return data
	}
}

function drawDifferencesJson(data,svg,overlapData){
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var path = d3.geo.path().projection(projection);
	var line = d3.svg.line()
	.x(function(d) { return d.y})
	    .y(function(d) { return d.y; })
	    .interpolate("basis");
		
	var differenceMap = d3.select("#svg-1 svg")
	//console.log(overlapData)
	differenceMap.append("path")
				.data(overlapData)
				.enter()
				.append("path")
				.attr("d", line)
				.attr("class","overlap")
				.attr("stroke",function(d){
					console.log(d)
					return "red"	
				})
	
}

function drawDifferences(data,svg,overlapData){
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var differenceMap = d3.select("#svg-1 svg")
	var dataById = table.group(data, ["Id"])
	var minDifference =20000
	var colorScale = d3.scale.linear().domain([0,200000]).range(["#aaa","red"])
	//console.log(dataById["360010131001"][0]["Median"])
	var differenceScale = d3.scale.linear().domain([0,200000]).range([.5,3])
	var differenceOpacityScale = d3.scale.linear().domain([0,200000]).range([0,1])
	
	differenceMap.selectAll("circle")
		.data(overlapData)
		.enter()
		.append("circle")
		.attr("cx", function(d){
			var lng = d["lng"]
			var lat = d["lat"]
			var x = (projection([lng,lat])[0])
			return x
		})
		.attr("cy", function(d){
			var lng = d["lng"]
			var lat = d["lat"]
			var y = (projection([lng,lat])[1])
			//console.log(y)
			return y
		})
		.attr("r", function(d){
			var id1 = d["id1"]
			var id2 = d["id2"]
			var income1 = parseInt(dataById[id1][0]["Median"])
			var income2 = parseInt(dataById[id2][0]["Median"])
			var difference = Math.abs(income1-income2)
			if(isNaN(difference) || difference < minDifference || isNaN(dataById[id1][0]["Median"]) || isNaN(dataById[id2][0]["Median"])){
				return .5
			}else{
				return differenceScale(difference)
			}
			return differenceScale(difference)
		})
		.attr("opacity",1)
		.attr("fill",function(d){
			var id1 = d["id1"]
			var id2 = d["id2"]
			var income1 = parseInt(dataById[id1][0]["Median"])
			var income2 = parseInt(dataById[id2][0]["Median"])
			var difference = Math.abs(income1-income2)
			var minDifference = Math.min(income1*.1, income2*.1)
			if(isNaN(difference) || difference < minDifference || isNaN(income1) || isNaN(income2)){
				return "#eee"
			}
			return colorScale(difference)
		})
		.on("mouseover",function(d){
			var id1 = d["id1"]
			var id2 = d["id2"]
			var income1 = parseInt(dataById[id1][0]["Median"])
			var income2 = parseInt(dataById[id2][0]["Median"])
			var difference = Math.abs(income1-income2)
			console.log(difference)
		})
}
function filterData(data,low,high){
	//console.log(data)
	var filteredData = table.filter(table.group(data, ["Median"]), function(list, income) {
		income = parseFloat(income)
		return (income >= low && income <= high)
	})
	//console.log(filteredData)
	return filteredData
}
function initNycMap(paths, data, column, svg,low,high) {
	renderMap(paths, svg, global.usMapWidth,global.usMapHeight)
	renderNycMap(data, column,svg,low,high)
}
function zoomed() {
	console.log("zoomed")
  map.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
 // map.select(".state-border").style("stroke-width", 1.5 / d3.event.scale + "px");
//  map.select(".county-border").style("stroke-width", .5 / d3.event.scale + "px");
}
function renderMap(data, selector,width,height) {
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var path = d3.geo.path().projection(projection);
	
	
	var zoom = d3.behavior.zoom()
	    .translate([0, 0])
	    .scale(1)
	    .scaleExtent([1, 8])
	    .on("zoom", zoomed);
		
	var svg = d3.select(selector).append("svg")
		.attr('height', width)
		.attr('width', height);
		
	map =  svg.selectAll(".map").append("g")
		
	svg.append("rect")
	    .attr("class", "overlay")
	    .attr("width", width)
	    .attr("height", height)
		.attr("fill","#fff")
	    .call(zoom);
			
	map.append("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "map-item")
		.attr("cursor", "pointer");

	return map
}
function renderNycMap(data, column,svg,low,high) {
	var map = d3.select(svg).selectAll(".map-item")

	var companiesByZipcode = table.group(data, ["Id"])
	//	var largest = table.maxCount(companiesByZipcode)

	//console.log(companiesByZipcode)
	var colorScale = function(d) {
		var scale = d3.scale.linear().domain([1,global.max]).range([global.gradientStart, global.gradientEnd]); 
		var x = companiesByZipcode[d.properties.GEOID]
		if(!x){
			return scale(1)
		}else{
			if(isNaN(x[0][column])) {
				return scale(1)
			}
			if(x[0][column] < low ||x[0][column] > high){
				return "#eee"
			}
			return scale(x[0][column])
		}
	}

	map.attr("stroke-opacity", 1)
		.attr("stroke","#eee")
		.attr("fill-opacity", 1)
		.attr("fill", colorScale)
			
		
		var tip = d3.tip()
		  .attr('class', 'd3-tip-nyc')
		  .offset([-10, 0])
	
		map.call(tip);
		map.on('mouseover', function(d){
			var currentZipcode = d.properties.GEOID
			var currentIncome = table.group(data, ["Id"])[currentZipcode][0][column]
			if(table.group(data, ["Id"])[currentZipcode]){
				if(isNaN(currentIncome)){
					currentIncome = "NA"
				}
				tipText = "median household income: $"+ currentIncome
				tip.html(function(d){return tipText})
				tip.show()
			}else{
				tip.html("not in income range")
				tip.show()
			}
			
		})
		.on('mouseout', function(d){
			tip.hide()
		})
		.on("click",function(d){
			var currentZipcode = d.properties.GEOID
			var currentIncome = table.group(data, ["Id"])[currentZipcode][0][column]
			
			if(!isNaN(currentIncome)){
				
				var high = parseInt(currentIncome*1.1)
				var low = parseInt(currentIncome*0.9)
				d3.select("#income-label").html("You selected household income of $"+currentIncome
				+"<br/>Showing income 10% above and below selection: $"+low+" - $"+high)
				tip.hide()
				redrawFilteredMaps(low,high)
				var y = d3.scale.linear().range([400, 0]).domain([0, global.max]);
			
				var topHandle = d3.select("#filters  .handle-top")
				var bottomHandle = d3.select("#filters .handle-bottom")
				topHandle.attr("y", y(high))
				bottomHandle.attr("y",y(low))
				updateSliderLocation()
			}			
			
		})
	return map
}
function resetFilter(){
	var y = d3.scale.linear().range([400, 0]).domain([0, global.max]);
	
	var topHandle = d3.select("#filters  .handle-top")
	var bottomHandle = d3.select("#filters .handle-bottom")
	topHandle.attr("y", y(global.maxIncome))
	bottomHandle.attr("y",y(0))
	updateSliderLocation()
}