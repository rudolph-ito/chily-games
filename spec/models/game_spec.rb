require 'spec_helper'

describe Game do
  context 'validating' do
    let(:game) { build(:game, game_params) }
    let(:game_params) { {} }

    context 'action' do
      context 'equal to setup' do
        let(:game_params) { {action: 'setup'} }
        specify { game.should be_valid }
      end

      context 'equal to play' do
        let(:game_params) { {action: 'play'} }
        specify { game.should be_valid }
      end

      context 'equal to anything else' do
        let(:game_params) { {action: nil} }
        specify { game.should be_invalid }
      end
    end

    context 'no alabaster' do
      let(:game_params) { {alabaster: nil} }
      specify { game.should be_invalid }
    end

    context 'no onyx' do
      let(:game_params) { {onyx: nil} }
      specify { game.should be_invalid }
    end

    context 'no variant' do
      let(:game_params) { {variant: nil} }
      specify { game.should be_invalid }
    end
  end

  describe '#color' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:game) { build(:game, alabaster: user1, onyx: user2) }

    context 'argument is alabaster user' do
      specify { game.color(user1).should == 'alabaster' }
    end

    context 'argument is onyx user' do
      specify { game.color(user2).should == 'onyx' }
    end
  end

  describe '#setup_errors' do
    let(:variant) { create(:variant, board_type: 'square', board_rows: 3, board_columns: 3, number_of_pieces: 2) }
    let!(:piece_type1) { create(:piece_type, name: 'King') }
    let!(:piece_rule1) { create(:piece_rule, variant: variant, piece_type: piece_type1, count_minimum: 1, count_maximum: 1) }
    let!(:piece_type2) { create(:piece_type, name: 'Dragon') }
    let!(:piece_rule2) { create(:piece_rule, variant: variant, piece_type: piece_type2, count_minimum: 0, count_maximum: 1) }
    let!(:piece_type3) { create(:piece_type, name: 'Catapult') }
    let!(:piece_rule3) { create(:piece_rule, variant: variant, piece_type: piece_type3, count_minimum: 0, count_maximum: 1) }

    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:game) { build(:game, variant: variant, alabaster: user1, onyx: user2)}

    context 'valid' do
      context 'for player 1' do
        it 'returns []' do
          game.setup_errors(user1, [
            {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
            {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 2, 'y' => 0}}
          ]).should == []
        end
      end

      context 'for onyx' do
        it 'returns []' do
         game.setup_errors(user2, [
            {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 2, 'y' => 2}},
            {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 1, 'y' => 2}},
          ]).should == []
        end
      end
    end

    context 'two pieces in same location' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
          {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 0, 'y' => 0}}
        ]).should == [
          {'coordinate' => {'x' => 0, 'y' => 0}, 'message' => 'Two pieces placed at the same coordinate.'}
        ]
      end
    end

    context 'piece in neutral territory' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
          {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 0, 'y' => 1}}
        ]).should == [
          {'coordinate' => {'x' => 0, 'y' => 1}, 'message' => 'Piece placed in neutral territory.'}
        ]
      end
    end

    context 'piece in enemy territory' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
          {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 0, 'y' => 2}}
        ]).should == [
          {'coordinate' => {'x' => 0, 'y' => 2}, 'message' => 'Piece placed in enemy territory.'}
        ]
      end
    end

    context 'too few pieces' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
        ]).should == [
          {'message' => 'Rules require placing 2 pieces. You placed 1.'}
        ]
      end
    end

    context 'too many pieces' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
          {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 1, 'y' => 0}},
          {'piece_type_id' => piece_type3.id, 'coordinate' => {'x' => 2, 'y' => 0}},
        ]).should == [
          {'message' => 'Rules require placing 2 pieces. You placed 3.'}
        ]
      end
    end

    context 'too few of piece type' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type2.id, 'coordinate' => {'x' => 0, 'y' => 0}},
          {'piece_type_id' => piece_type3.id, 'coordinate' => {'x' => 1, 'y' => 0}},
        ]).should == [
          {'message' => 'Rules require placing 1 king. You placed 0.'}
        ]
      end
    end

    context 'too many of piece type' do
      it 'returns errors' do
        game.setup_errors(user1, [
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 0, 'y' => 0}},
          {'piece_type_id' => piece_type1.id, 'coordinate' => {'x' => 1, 'y' => 0}},
        ]).should == [
          {'message' => 'Rules require placing 1 king. You placed 2.'}
        ]
      end
    end
  end
end
