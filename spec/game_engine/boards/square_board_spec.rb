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
        expect(board.coordinate_valid?('x'=>0, 'y'=>0)).to be_true
      end

      it 'off to the left is invalid' do
        expect(board.coordinate_valid?('x'=>-1, 'y'=>0)).to be_false
      end

      it 'off to the bottom is invalid' do
        expect(board.coordinate_valid?('x'=>0, 'y'=>-1)).to be_false
      end

      it 'off to the right is invalid' do
        expect(board.coordinate_valid?('x'=>2, 'y'=>0)).to be_false
      end

      it 'off to the top is invalid' do
        expect(board.coordinate_valid?('x'=>0, 'y'=>2)).to be_false
      end
    end
  end

  context '#center_coordinate' do
    context '2x2' do
      let(:rows) { 2 }
      let(:columns) { 2 }

      it 'is 1,1' do
        expect(board.center_coordinate).to eql('x'=>1, 'y'=>1)
      end
    end

    context '3x2' do
      let(:rows) { 3 }
      let(:columns) { 2 }

      it 'is 1,1' do
        expect(board.center_coordinate).to eql('x'=>1, 'y'=>1)
      end
    end

    context '2x3' do
      let(:rows) { 2 }
      let(:columns) { 3 }

      specify do
        expect(board.center_coordinate).to eql('x'=>1, 'y'=>1)
      end
    end

    context '3x3' do
      let(:rows) { 3 }
      let(:columns) { 3 }

      it 'is 1,1' do
        expect(board.center_coordinate).to eql('x'=>1, 'y'=>1)
      end
    end


    context '4x4' do
      let(:rows) { 4 }
      let(:columns) { 4 }

      it 'is 2,2' do
        expect(board.center_coordinate).to eql('x'=>2, 'y'=>2)
      end
    end
  end

  context '#territory' do
    context '2x2' do
      let(:rows) { 2 }
      let(:columns) { 2 }

      it 'top half is alabaster' do
        expect(board.territory('x'=>0, 'y'=>0)).to eql 'alabaster'
      end

      it 'bottom half is onyx' do
        expect(board.territory('x'=>0, 'y'=>1)).to eql 'onyx'
      end
    end

    context '3x2' do
      let(:rows) { 3 }
      let(:columns) { 2 }

      it 'center line is neutral' do
        expect(board.territory('x'=>0, 'y'=>1)).to eql 'neutral'
      end

      it 'above center line is alabaster' do
        expect(board.territory('x'=>0, 'y'=>0)).to eql 'alabaster'
      end

      it 'beloew center line half is onyx' do
        expect(board.territory('x'=>0, 'y'=>2)).to eql 'onyx'
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
