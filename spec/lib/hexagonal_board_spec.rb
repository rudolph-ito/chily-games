require 'spec_helper'

describe "Variant: hexagonal board" do
  let(:variant_parameters) { {} }
  let(:variant) { build :variant, variant_parameters.merge(board_type: 'hexagonal') }
  let(:board) { HexagonalBoard.new(variant) }

  context '#coordinate_valid?' do
    context 'size 3' do
      let(:variant_parameters) { { board_size: 3 } }

      it 'center is valid' do
        board.coordinate_valid?({'x' => 0, 'y' => 0, 'z' => 0}).should be_true
      end

      it 'edge is valid' do
        board.coordinate_valid?({'x' => 1, 'y' => 1, 'z' => 0}).should be_true
      end

      it 'off board is not valid' do
        board.coordinate_valid?({'x' => 2, 'y' => 1, 'z' => 0}).should be_false
      end
    end
  end

  context '#territory' do
    context 'size 3' do
      let(:variant_parameters) { { board_size: 3 } }

      it 'center line is neutral' do
        board.territory({'x' => 0, 'y' => 0, 'z' => 0}).should == 'neutral'
      end

      it 'above center line is alabaster' do
        board.territory({'x' => 0, 'y' => 1, 'z' => 1}).should == 'alabaster'
      end

      it 'below center line is onyx' do
        board.territory({'x' => 0, 'y' => -1, 'z' => -1}).should == 'onyx'
      end
    end
  end

  context '#center_coordinate' do
    context 'size 3' do
      let(:variant_parameters) { { board_size: 3 } }
      specify do
        board.center_coordinate.should == {'x' => 0, 'y' => 0, 'z' => 0}
      end
    end
  end
end
