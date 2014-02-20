require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/hexagonal_board.rb'

describe HexagonalBoard do
  let(:board) { HexagonalBoard.new(size) }
  let(:size) { 3 }

  context '#coordinate_valid?' do
    context 'size 3' do
      let(:size) { 3 }

      it 'center is valid' do
        board.coordinate_valid?('x'=>0, 'y'=>0, 'z'=>0).should be_true
      end

      it 'edge is valid' do
        board.coordinate_valid?('x'=>1, 'y'=>1, 'z'=>0).should be_true
      end

      it 'off board is not valid' do
        board.coordinate_valid?('x'=>2, 'y'=>1, 'z'=>0).should be_false
      end
    end
  end

  context '#reduce_coordinate' do
    context 'no reduction needed' do
      it 'returns the coordinate' do
        expect(board.reduce_coordinate('x'=>0, 'y'=>0, 'z'=>0)).to eql('x'=>0, 'y'=>0, 'z'=>0)
      end
    end

    context 'single reduction needed' do
      it 'x and y reduce to z' do
        expect(board.reduce_coordinate('x'=>1, 'y'=>-1, 'z'=>0)).to eql('x'=>0, 'y'=>0, 'z'=>-1)
        expect(board.reduce_coordinate('x'=>-1, 'y'=>1, 'z'=>0)).to eql('x'=>0, 'y'=>0, 'z'=>1)
      end

      it 'x and z reduce to y' do
        expect(board.reduce_coordinate('x'=>1, 'y'=>0, 'z'=>1)).to eql('x'=>0, 'y'=>1, 'z'=>0)
        expect(board.reduce_coordinate('x'=>-1, 'y'=>0, 'z'=>-1)).to eql('x'=>0, 'y'=>-1, 'z'=>0)
      end

      it 'y and z reduce to x' do
        expect(board.reduce_coordinate('x'=>0, 'y'=>-1, 'z'=>1)).to eql('x'=>-1, 'y'=>0, 'z'=>0)
        expect(board.reduce_coordinate('x'=>0, 'y'=>1, 'z'=>-1)).to eql('x'=>1, 'y'=>0, 'z'=>0)
      end
    end

    context 'multiple reducetions needed' do
      it 'returns the reduced coordinate' do
        expect(board.reduce_coordinate('x'=>3, 'y'=>-2, 'z'=>-1)).to eql('x'=>1, 'y'=>0, 'z'=>-3)
      end
    end
  end

  context '#center_coordinate' do
    context 'size 3' do
      let(:size) { 3 }

      it 'is 0,0,0' do
        board.center_coordinate.should == {'x'=>0, 'y'=>0, 'z'=>0}
      end
    end
  end

  context '#territory' do
    context 'size 3' do
     let(:size) { 3 }

      it 'center line is neutral' do
        board.territory({'x'=>0, 'y'=>0, 'z'=>0}).should == 'neutral'
      end

      it 'above center line is alabaster' do
        board.territory({'x'=>0, 'y'=>1, 'z'=>1}).should == 'alabaster'
      end

      it 'below center line is onyx' do
        board.territory({'x'=>0, 'y'=>-1, 'z'=>-1}).should == 'onyx'
      end
    end
  end

  context '#directional_functions' do
    let(:directional_functions) { board.directional_functions(directional_type) }
    let(:coordinate) { {'x'=>0, 'y'=>0, 'z'=>0} }
    let(:results) { directional_functions.map{ |f| temp = coordinate.clone; f.call(temp); temp } }

    context 'orthogonal' do
      let(:directional_type) { 'orthogonal'}

      it 'returns orthogonal functions' do
        expect(results).to match_array [{"x"=>1, "y"=>0, "z"=>0}, {"x"=>-1, "y"=>0, "z"=>0}, {"x"=>0, "y"=>1, "z"=>0}, {"x"=>0, "y"=>-1, "z"=>0}, {"x"=>0, "y"=>0, "z"=>1}, {"x"=>0, "y"=>0, "z"=>-1}]
      end
    end

    context 'diagonal' do
      let(:directional_type) { 'diagonal'}

      it 'returns diagonal functions' do
        expect(results).to match_array [{"x"=>1, "y"=>1, "z"=>0}, {"x"=>-1, "y"=>-1, "z"=>0}, {"x"=>1, "y"=>0, "z"=>-1}, {"x"=>-1, "y"=>0, "z"=>1}, {"x"=>0, "y"=>1, "z"=>1}, {"x"=>0, "y"=>-1, "z"=>-1}]
      end
    end

    context 'other' do
      let(:directional_type) { 'other'}

      it 'raises error' do
        expect{ directional_functions }.to raise_error("HexagonalBoard#directional_functions does not support type: other" )
      end
    end
  end
end
