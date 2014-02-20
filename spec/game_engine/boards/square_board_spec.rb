require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/boards/square_board.rb'

describe SquareBoard do
  let(:board) { SquareBoard.new(rows, columns) }
  let(:rows) { 2 }
  let(:columns) { 2 }

  context '#coordinate_valid?' do
    context '2x2' do
      let(:rows) { 2 }
      let(:columns) { 2 }

      it 'on board is valid' do
        board.coordinate_valid?('x'=>0, 'y'=>0).should be_true
      end

      it 'off to the left is invalid' do
        board.coordinate_valid?('x'=>-1, 'y'=>0).should be_false
      end

      it 'off to the bottom is invalid' do
        board.coordinate_valid?('x'=>0, 'y'=>-1).should be_false
      end

      it 'off to the right is invalid' do
        board.coordinate_valid?('x'=>2, 'y'=>0).should be_false
      end

      it 'off to the top is invalid' do
        board.coordinate_valid?('x'=>0, 'y'=>2).should be_false
      end
    end
  end

  context '#reduce_coordinate' do
    it 'returns the coordinate' do
      expect(board.reduce_coordinate('x'=>0, 'y'=>0)).to eql('x'=>0, 'y'=>0)
      expect(board.reduce_coordinate('x'=>2, 'y'=>3)).to eql('x'=>2, 'y'=>3)
    end
  end

  context '#center_coordinate' do
    context '2x2' do
      let(:rows) { 2 }
      let(:columns) { 2 }

      it 'is 1,1' do
        board.center_coordinate.should == {'x'=>1, 'y'=>1}
      end
    end

    context '3x2' do
      let(:rows) { 3 }
      let(:columns) { 2 }

      it 'is 1,1' do
        board.center_coordinate.should == {'x'=>1, 'y'=>1}
      end
    end

    context '2x3' do
      let(:rows) { 2 }
      let(:columns) { 3 }

      specify do
        board.center_coordinate.should == {'x'=>1, 'y'=>1}
      end
    end

    context '3x3' do
      let(:rows) { 3 }
      let(:columns) { 3 }

      it 'is 1,1' do
        board.center_coordinate.should == {'x'=>1, 'y'=>1}
      end
    end


    context '4x4' do
      let(:rows) { 4 }
      let(:columns) { 4 }

      it 'is 2,2' do
        board.center_coordinate.should == {'x'=>2, 'y'=>2}
      end
    end
  end

  context '#territory' do
    context '2x2' do
      let(:rows) { 2 }
      let(:columns) { 2 }

      it 'top half is alabaster' do
        board.territory('x'=>0, 'y'=>0).should == 'alabaster'
      end

      it 'bottom half is onyx' do
        board.territory('x'=>0, 'y'=>1).should == 'onyx'
      end
    end

    context '3x2' do
      let(:rows) { 3 }
      let(:columns) { 2 }

      it 'center line is neutral' do
        board.territory('x'=>0, 'y'=>1).should == 'neutral'
      end

      it 'above center line is alabaster' do
        board.territory('x'=>0, 'y'=>0).should == 'alabaster'
      end

      it 'beloew center line half is onyx' do
        board.territory('x'=>0, 'y'=>2).should == 'onyx'
      end
    end
  end

  context '#directional_functions' do
    let(:directional_functions) { board.directional_functions(directional_type) }
    let(:coordinate) { {'x'=>4, 'y'=>4} }
    let(:results) { directional_functions.map{ |f| temp = coordinate.clone; f.call(temp); temp } }


    context 'orthogonal' do
      let(:directional_type) { 'orthogonal'}

      it 'returns orthogonal functions' do
        expect(results).to match_array [{'x'=>4, 'y'=>3}, {'x'=>4, 'y'=>5}, {'x'=>3, 'y'=>4}, {'x'=>5, 'y'=>4}]
      end
    end

    context 'diagonal' do
      let(:directional_type) { 'diagonal'}

      it 'returns diagonal functions' do
        expect(results).to match_array [{"x"=>5, "y"=>5}, {"x"=>5, "y"=>3}, {"x"=>3, "y"=>5}, {"x"=>3, "y"=>3}]
      end
    end

    context 'other' do
      let(:directional_type) { 'other'}

      it 'raises error' do
        expect{ directional_functions }.to raise_error("SquareBoard#directional_functions does not support type: other" )
      end
    end
  end
end
