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

  describe "#ply_valid?" do
    let(:piece_type) { create :piece_type }
    let(:piece_rule_parameters) { {} }
    let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 2, movement_maximum: 2}.merge(piece_rule_parameters) }

    let(:variant) { create :variant, board_type: 'hexagonal', board_size: 4  }

    let(:user1) { create :user }
    let(:user2) { create :user }
    let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

    let(:from_coordinate) { {'x' => 0, 'y' => 0, 'z' => 0} }
    let(:valid_to_coordinate) { {'x' => 2, 'y' => 0, 'z' => 0} }
    let(:invalid_to_coordinate) { {'x' => 2, 'y' => 1, 'z' => 0} }
    let(:valid_range_capture_coordinate) { {'x' => 3, 'y' => 0, 'z' => 0} }
    let(:invalid_range_capture_coordinate) { {'x' => 3, 'y' => 1, 'z' => 0} }
    let!(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: from_coordinate }

    context "movement_capture" do
      let(:piece_rule_parameters) { { capture_type: 'movement' } }

      context 'valid' do
        it 'returns true' do
          expect( game.ply_valid?(piece, valid_to_coordinate) ).to be_true
        end
      end

      context 'invalid' do
        it 'returns false' do
          expect( game.ply_valid?(piece, invalid_to_coordinate) ).to be_false
        end
      end
    end

    context "range_capture" do
      let(:piece_rule_parameters) { { capture_type: 'range' } }

      context 'valid' do
        it 'returns true' do
          expect( game.ply_valid?(piece, valid_to_coordinate) ).to be_true
        end

        context 'with range capture' do
          it 'returns true' do
            expect( game.ply_valid?(piece, valid_to_coordinate, valid_range_capture_coordinate) ).to be_true
          end
        end
      end

      context 'invalid' do
        it 'returns false' do
          expect( game.ply_valid?(piece, invalid_to_coordinate) ).to be_false
        end

        context 'with range capture' do
          it 'returns false' do
            expect( game.ply_valid?(piece, valid_to_coordinate, invalid_range_capture_coordinate) ).to be_false
          end
        end
      end
    end
  end
end
