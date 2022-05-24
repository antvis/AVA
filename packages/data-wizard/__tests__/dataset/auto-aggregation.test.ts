// import { findHierarchy } from '../../src/dataset/auto-aggregation';
import { DataFrame } from '../../src';
import  AutoAggregation from '../../src/dataset/auto-aggregation';

// const isHierarchicalTest = [{'gender': 'male', 'name':'john', 'time':'mid-term', 'score': 90}, {'gender': 'male', 'name':'jack', 'time':'mid-term', 'score': 90}, {'gender': 'female', 'name':'linda', 'time':'mid-term', 'score': 90}, {'gender': 'female', 'name': 'grace', 'time':'mid-term', 'score': 90}, {'gender': 'male', 'name':'john', 'time':'final-term', 'score': 90}, {'gender': 'male', 'name':'jack', 'time':'final-term', 'score': 90}, {'gender': 'female', 'name':'linda', 'time':'final-term', 'score': 90}, {'gender': 'female', 'name': 'grace', 'time':'final-term', 'score': 90}];
const isHierarchicalTest =  [
  {
    "year": "2001-01-01T00:00:00",
    "net_generation": 35361,
    "source": "Fossil Fuels"
  },
  {
    "year": "2002-01-01T00:00:00",
    "net_generation": 35991,
    "source": "Fossil Fuels"
  },
  {
    "year": "2003-01-01T00:00:00",
    "net_generation": 36234,
    "source": "Fossil Fuels"
  },
  {
    "year": "2004-01-01T00:00:00",
    "net_generation": 36205,
    "source": "Fossil Fuels"
  },
  {
    "year": "2005-01-01T00:00:00",
    "net_generation": 36883,
    "source": "Fossil Fuels"
  },
  {
    "year": "2006-01-01T00:00:00",
    "net_generation": 37014,
    "source": "Fossil Fuels"
  },
  {
    "year": "2007-01-01T00:00:00",
    "net_generation": 41389,
    "source": "Fossil Fuels"
  },
  {
    "year": "2008-01-01T00:00:00",
    "net_generation": 42734,
    "source": "Fossil Fuels"
  },
  {
    "year": "2009-01-01T00:00:00",
    "net_generation": 38620,
    "source": "Fossil Fuels"
  },
  {
    "year": "2010-01-01T00:00:00",
    "net_generation": 42750,
    "source": "Fossil Fuels"
  },
  {
    "year": "2011-01-01T00:00:00",
    "net_generation": 39361,
    "source": "Fossil Fuels"
  },
  {
    "year": "2012-01-01T00:00:00",
    "net_generation": 37379,
    "source": "Fossil Fuels"
  },
  {
    "year": "2013-01-01T00:00:00",
    "net_generation": 34873,
    "source": "Fossil Fuels"
  },
  {
    "year": "2014-01-01T00:00:00",
    "net_generation": 35250,
    "source": "Fossil Fuels"
  },
  {
    "year": "2015-01-01T00:00:00",
    "net_generation": 32319,
    "source": "Fossil Fuels"
  },
  {
    "year": "2016-01-01T00:00:00",
    "net_generation": 28437,
    "source": "Fossil Fuels"
  },
  {
    "year": "2017-01-01T00:00:00",
    "net_generation": 29329,
    "source": "Fossil Fuels"
  },
  {
    "year": "2001-01-01T00:00:00",
    "net_generation": 3853,
    "source": "Nuclear Energy"
  },
  {
    "year": "2002-01-01T00:00:00",
    "net_generation": 4574,
    "source": "Nuclear Energy"
  },
  {
    "year": "2003-01-01T00:00:00",
    "net_generation": 3988,
    "source": "Nuclear Energy"
  },
  {
    "year": "2004-01-01T00:00:00",
    "net_generation": 4929,
    "source": "Nuclear Energy"
  },
  {
    "year": "2005-01-01T00:00:00",
    "net_generation": 4538,
    "source": "Nuclear Energy"
  },
  {
    "year": "2006-01-01T00:00:00",
    "net_generation": 5095,
    "source": "Nuclear Energy"
  },
  {
    "year": "2007-01-01T00:00:00",
    "net_generation": 4519,
    "source": "Nuclear Energy"
  },
  {
    "year": "2008-01-01T00:00:00",
    "net_generation": 5282,
    "source": "Nuclear Energy"
  },
  {
    "year": "2009-01-01T00:00:00",
    "net_generation": 4679,
    "source": "Nuclear Energy"
  },
  {
    "year": "2010-01-01T00:00:00",
    "net_generation": 4451,
    "source": "Nuclear Energy"
  },
  {
    "year": "2011-01-01T00:00:00",
    "net_generation": 5215,
    "source": "Nuclear Energy"
  },
  {
    "year": "2012-01-01T00:00:00",
    "net_generation": 4347,
    "source": "Nuclear Energy"
  },
  {
    "year": "2013-01-01T00:00:00",
    "net_generation": 5321,
    "source": "Nuclear Energy"
  },
  {
    "year": "2014-01-01T00:00:00",
    "net_generation": 4152,
    "source": "Nuclear Energy"
  },
  {
    "year": "2015-01-01T00:00:00",
    "net_generation": 5243,
    "source": "Nuclear Energy"
  },
  {
    "year": "2016-01-01T00:00:00",
    "net_generation": 4703,
    "source": "Nuclear Energy"
  },
  {
    "year": "2017-01-01T00:00:00",
    "net_generation": 5214,
    "source": "Nuclear Energy"
  },
  {
    "year": "2001-01-01T00:00:00",
    "net_generation": 1437,
    "source": "Renewables"
  },
  {
    "year": "2002-01-01T00:00:00",
    "net_generation": 1963,
    "source": "Renewables"
  },
  {
    "year": "2003-01-01T00:00:00",
    "net_generation": 1885,
    "source": "Renewables"
  },
  {
    "year": "2004-01-01T00:00:00",
    "net_generation": 2102,
    "source": "Renewables"
  },
  {
    "year": "2005-01-01T00:00:00",
    "net_generation": 2724,
    "source": "Renewables"
  },
  {
    "year": "2006-01-01T00:00:00",
    "net_generation": 3364,
    "source": "Renewables"
  },
  {
    "year": "2007-01-01T00:00:00",
    "net_generation": 3870,
    "source": "Renewables"
  },
  {
    "year": "2008-01-01T00:00:00",
    "net_generation": 5070,
    "source": "Renewables"
  },
  {
    "year": "2009-01-01T00:00:00",
    "net_generation": 8560,
    "source": "Renewables"
  },
  {
    "year": "2010-01-01T00:00:00",
    "net_generation": 10308,
    "source": "Renewables"
  },
  {
    "year": "2011-01-01T00:00:00",
    "net_generation": 11795,
    "source": "Renewables"
  },
  {
    "year": "2012-01-01T00:00:00",
    "net_generation": 14949,
    "source": "Renewables"
  },
  {
    "year": "2013-01-01T00:00:00",
    "net_generation": 16476,
    "source": "Renewables"
  },
  {
    "year": "2014-01-01T00:00:00",
    "net_generation": 17452,
    "source": "Renewables"
  },
  {
    "year": "2015-01-01T00:00:00",
    "net_generation": 19091,
    "source": "Renewables"
  },
  {
    "year": "2016-01-01T00:00:00",
    "net_generation": 21241,
    "source": "Renewables"
  },
  {
    "year": "2017-01-01T00:00:00",
    "net_generation": 21933,
    "source": "Renewables"
  }
]


describe('Aggregation', () => {
  test('findHierarchy', () => {
    const dataFrame = new DataFrame(isHierarchicalTest);
    const aggObj = new AutoAggregation(dataFrame);
    const result = aggObj.getDefaultAggregatedResult();

    expect(result).toStrictEqual({"datum": [{"gender": "male", "score": 360}, {"gender": "female", "score": 360}], "generalDimensions": [], "hierarchicalDimensions": ["gender", "name"]});
  });
});
