import json
from shapely.geometry import shape, Point
import math
import csv

def main():

	with open('checkBoundarieszones/zillowNei.geojson', 'r') as f:
		js = json.load(f)

	polygons = [] 
	ids = []
	for i in range(len(js['features'])):
		feature = js['features'][i]
		print feature
		ids.append(feature['properties']["ZONE_TYPE"])
		polygon = shape(feature['geometry'])	
		polygons.append(polygon)

	print len(polygons)
	points = [] 
	i = 0
	with open('checkBoundarieszones/cambridge_huegroups_1_23.csv', 'r') as f:
		reader = csv.reader(f)
		for line in reader:
			if i == 0: 
				i += 1 
				continue
			points.append(line)

	i = 0 
	num_points = len(points)
	print num_points
	for p in points:
		if i % math.floor(num_points / 1000) == 0: print 'Done with %i' % (i*100 / num_points)
		point = Point(float(p[1]), float(p[0]))

		for j in range(len(polygons)):
			polygon = polygons[j]
			pid = ids[j]

			if polygon.contains(point): 
				p.append(pid)
				break;
		i += 1

	with open('checkBoundaries/result.csv', 'w') as fw:
		writer = csv.writer(fw)
		writer.writerows(points)
main()
