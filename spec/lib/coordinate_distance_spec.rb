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
        specify { expect(result).to eql Math.sqrt(2) }
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

      context 'small distance' do
        let(:coordinate2) { {'x'=>0, 'y'=>1, 'z'=>1} }
        specify { expect(result).to eql Math.sqrt(2) }
      end

      context 'large distance' do
        let(:coordinate2) { {'x'=>0, 'y'=>3, 'z'=>3} }
        specify { expect(result).to eql Math.sqrt(18) }
      end
    end
  end
end
