require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'

describe HexagonalBoard do
  let(:board) { HexagonalBoard.new(size) }
  let(:size) { 3 }

  context '#coordinate_valid?' do
    context 'size 3' do
      let(:size) { 3 }

      it 'center is valid' do
        expect(board.coordinate_valid?('x'=>3, 'y'=>3)).to be_true
      end

      context 'top left' do
        specify { expect(board.coordinate_valid?('x'=>3, 'y'=>0)).to be_true }
        specify { expect(board.coordinate_valid?('x'=>2, 'y'=>0)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>3, 'y'=>-1)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>4, 'y'=>-1)).to be_false }
      end

      context 'top right' do
        specify { expect(board.coordinate_valid?('x'=>6, 'y'=>0)).to be_true }
        specify { expect(board.coordinate_valid?('x'=>6, 'y'=>-1)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>7, 'y'=>-1)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>7, 'y'=>0)).to be_false }
      end

      context 'right' do
        specify { expect(board.coordinate_valid?('x'=>6, 'y'=>3)).to be_true }
        specify { expect(board.coordinate_valid?('x'=>7, 'y'=>2)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>7, 'y'=>3)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>6, 'y'=>4)).to be_false }
      end

      context 'bottom right' do
        specify { expect(board.coordinate_valid?('x'=>3, 'y'=>6)).to be_true }
        specify { expect(board.coordinate_valid?('x'=>4, 'y'=>6)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>3, 'y'=>7)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>2, 'y'=>7)).to be_false }
      end

      context 'bottom left' do
        specify { expect(board.coordinate_valid?('x'=>0, 'y'=>6)).to be_true }
        specify { expect(board.coordinate_valid?('x'=>0, 'y'=>7)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>-1, 'y'=>7)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>-1, 'y'=>5)).to be_false }
      end

      context 'left' do
        specify { expect(board.coordinate_valid?('x'=>0, 'y'=>3)).to be_true }
        specify { expect(board.coordinate_valid?('x'=>-1, 'y'=>4)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>-1, 'y'=>3)).to be_false }
        specify { expect(board.coordinate_valid?('x'=>0, 'y'=>2)).to be_false }
      end
    end
  end

  context '#center_coordinate' do
    context 'size 3' do
      let(:size) { 3 }

      it 'is 3,3' do
        expect(board.center_coordinate).to eql('x'=>3, 'y'=>3)
      end
    end
  end

  context '#territory' do
    context 'size 3' do
     let(:size) { 3 }

      it 'center line is neutral' do
        expect(board.territory('x'=>3, 'y'=>3)).to eql 'neutral'
      end

      it 'above center line is alabaster' do
        expect(board.territory('x'=>4, 'y'=>1)).to eql 'alabaster'
      end

      it 'below center line is onyx' do
        expect(board.territory('x'=>2, 'y'=>5)).to eql 'onyx'
      end
    end
  end

  context '#directional_functions' do
    let(:directional_functions) { board.directional_functions(directional_type) }
    let(:coordinate) { {'x'=>3, 'y'=>3} }
    let(:results) { directional_functions.map{ |f| temp = coordinate.clone; f.call(temp); temp } }

    context 'orthogonal' do
      let(:directional_type) { 'orthogonal'}

      it 'returns orthogonal functions' do
        expect(results).to match_array [{"x"=>3, "y"=>2}, {"x"=>2, "y"=>3}, {"x"=>2, "y"=>4}, {"x"=>3, "y"=>4}, {"x"=>4, "y"=>3}, {"x"=>4, "y"=>2}]
      end
    end

    context 'diagonal' do
      let(:directional_type) { 'diagonal'}

      it 'returns diagonal functions' do
        expect(results).to match_array [{"x"=>2, "y"=>2}, {"x"=>1, "y"=>4}, {"x"=>2, "y"=>5}, {"x"=>4, "y"=>4}, {"x"=>5, "y"=>2}, {"x"=>4, "y"=>1}]
      end
    end

    context 'other' do
      let(:directional_type) { 'other'}

      it 'raises error' do
        expect{ directional_functions }.to raise_error("HexagonalBoard#directional_functions does not support type: other" )
      end
    end
  end

  context '#distance' do
    let(:coordinate) { {'x'=>3, 'y'=>3} }

    context 'one space away' do
      specify{ expect(board.distance(coordinate, {'x'=>4, 'y'=>3})).to eql 1 }
      specify{ expect(board.distance(coordinate, {'x'=>4, 'y'=>2})).to eql 1 }
    end
  end
end
