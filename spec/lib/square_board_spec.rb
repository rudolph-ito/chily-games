require 'spec_helper'

describe "Variant: square board" do
  let(:variant_parameters) { {} }
  let(:variant) { build :variant, variant_parameters.merge(board_type: 'square') }
  let(:board) { SquareBoard.new(variant) }

  context '#coordinate_valid?' do
    context '2x2' do
      let(:variant_parameters) { { board_rows: 2, board_columns: 2 } }

      it 'on board is valid' do
        board.coordinate_valid?({'x' => 0, 'y' => 0}).should be_true
      end

      it 'off to the left is invalid' do
        board.coordinate_valid?({'x' => -1, 'y' => 0}).should be_false
      end

      it 'off to the bottom is invalid' do
        board.coordinate_valid?({'x' => 0, 'y' => -1}).should be_false
      end

      it 'off to the right is invalid' do
        board.coordinate_valid?({'x' => 2, 'y' => 0}).should be_false
      end

      it 'off to the top is invalid' do
        board.coordinate_valid?({'x' => 0, 'y' => 2}).should be_false
      end
    end
  end

  context '#territory' do
    context '2x2' do
      let(:variant_parameters) { { board_rows: 2, board_columns: 2 } }

      it 'top half is alabaster' do
        board.territory({'x' => 0, 'y' => 0}).should == 'alabaster'
      end

      it 'bottom half is onyx' do
        board.territory({'x' => 0, 'y' => 1}).should == 'onyx'
      end
    end

    context '3x2' do
      let(:variant_parameters) { { board_rows: 3, board_columns: 2 } }

      it 'center line is neutral' do
        board.territory({'x' => 0, 'y' => 1}).should == 'neutral'
      end

      it 'above center line is alabaster' do
        board.territory({'x' => 0, 'y' => 0}).should == 'alabaster'
      end

      it 'beloew center line half is onyx' do
        board.territory({'x' => 0, 'y' => 2}).should == 'onyx'
      end
    end
  end

  context '#center_coordinate' do
    context '2x2' do
      let(:variant_parameters) { { board_rows: 2, board_columns: 2 } }
      specify do
        board.center_coordinate.should == { 'x' => 1, 'y' => 1 }
      end
    end

    context '3x2' do
      let(:variant_parameters) { { board_rows: 2, board_columns: 3 } }
      specify do
        board.center_coordinate.should == { 'x' => 1, 'y' => 1 }
      end
    end

    context '3x2' do
      let(:variant_parameters) { { board_rows: 3, board_columns: 2 } }
      specify do
        board.center_coordinate.should == { 'x' => 1, 'y' => 1 }
      end
    end

    context '3x3' do
      let(:variant_parameters) { { board_rows: 3, board_columns: 3 } }
      specify do
        board.center_coordinate.should == { 'x' => 1, 'y' => 1 }
      end
    end
  end
end
