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

      context 'equal to move' do
        let(:game_params) { {action: 'move'} }
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
      specify { game.color(user1.id).should == 'alabaster' }
    end

    context 'argument is onyx user' do
      specify { game.color(user2.id).should == 'onyx' }
    end
  end

  describe '#setup_errors' do
    let(:variant) { create(:variant, board_type: 'square', board_rows: 3, board_columns: 3) }
    let!(:piece_type1) { create(:piece_type, name: 'King') }
    let!(:piece_rule1) { create(:piece_rule, variant: variant, piece_type: piece_type1, count: 1) }
    let!(:piece_type2) { create(:piece_type, name: 'Dragon') }
    let!(:piece_rule2) { create(:piece_rule, variant: variant, piece_type: piece_type2, count: 1) }

    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:game) { create(:game, variant: variant, alabaster: user1, onyx: user2)}

    context 'valid' do
      context 'for alabaster' do
        it 'returns []' do
          game.setup_add(user1, 'piece', piece_type1.id, {'x' => 0, 'y' => 0})
          game.setup_add(user1, 'piece', piece_type2.id, {'x' => 2, 'y' => 0})
          expect(game.setup_errors(user1)).to eql []
        end
      end

      context 'for onyx' do
        it 'returns []' do
          game.setup_add(user2, 'piece', piece_type1.id, {'x' => 2, 'y' => 2})
          game.setup_add(user2, 'piece', piece_type2.id, {'x' => 1, 'y' => 2})
          expect(game.setup_errors(user2)).to eql []
        end
      end
    end

    context 'too few of piece type' do
      it 'returns errors' do
        game.setup_add(user1, 'piece', piece_type1.id, {'x' => 0, 'y' => 0})
        expect(game.setup_errors(user1)).to eql ['Please place 1 dragon. You placed 0.']
      end
    end

    context 'too many of piece type' do
      it 'returns errors' do
        game.setup_add(user1, 'piece', piece_type1.id, {'x' => 0, 'y' => 0})
        game.setup_add(user1, 'piece', piece_type1.id, {'x' => 1, 'y' => 0})
        game.setup_add(user1, 'piece', piece_type2.id, {'x' => 2, 'y' => 0})
        expect(game.setup_errors(user1)).to eql ['Please place 1 king. You placed 2.']
      end
    end
  end
end
