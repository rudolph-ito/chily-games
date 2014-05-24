require 'minimal_spec_helper'
require File.expand_path("../../../lib/coordinate_distance.rb", __FILE__)

describe CoordinateDistance do
  context '.calculate' do
    let(:result) { CoordinateDistance.calculate(coordinate1, coordinate2) }

    context 'x and y' do
      let(:coordinate1) { {'x'=>0, 'y'=>0} }

      context 'zero distance' do
        let(:coordinate2) { coordinate1 }
        specify { expect(result).to eql 0.0 }
      end

      context 'small distance' do
        let(:coordinate2) { {'x'=>1, 'y'=>1} }
        specify { expect(result).to eql Math.sqrt(2).round(2) }
      end

      context 'large distance' do
        let(:coordinate2) { {'x'=>3, 'y'=>4} }
        specify { expect(result).to eql 5.0 }
      end
    end

    context 'x, y, and z' do
      let(:coordinate1) { {'x'=>0, 'y'=>0, 'z'=>0} }

      context 'zero distance' do
        let(:coordinate2) { coordinate1 }
        specify { expect(result).to eql 0.0 }
      end

      context do
        let(:result1) { CoordinateDistance.calculate({'x'=>0, 'y'=>0, 'z'=>0}, {'x'=>1, 'y'=>0, 'z'=>0}) }
        let(:result2) { CoordinateDistance.calculate({'x'=>0, 'y'=>0, 'z'=>0}, {'x'=>0, 'y'=>1, 'z'=>0}) }
        specify { expect(result1).to eql result2 }
      end

      context do
        let(:result1) { CoordinateDistance.calculate({'x'=>0, 'y'=>0, 'z'=>0}, {'x'=>1, 'y'=>2, 'z'=>0}) }
        let(:result2) { CoordinateDistance.calculate({'x'=>0, 'y'=>0, 'z'=>0}, {'x'=>-1, 'y'=>0, 'z'=>2}) }
        specify { expect(result1).to eql result2 }
      end

      context do
        let(:result1) { CoordinateDistance.calculate({'x'=>0, 'y'=>1, 'z'=>0}, {'x'=>1, 'y'=>1, 'z'=>0}) }
        let(:result2) { CoordinateDistance.calculate({'x'=>0, 'y'=>1, 'z'=>0}, {'x'=>1, 'y'=>0, 'z'=>0}) }
        specify { expect(result1).to eql result2 }
      end
    end
  end
end
