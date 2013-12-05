require 'spec_helper'

describe "Game: square board" do
  let(:piece_type) { create :piece_type }
  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 4, 'y' => 4} }

  let(:variant_parameters) { {} }
  let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }

  let(:piece_rule_parameters) { {} }
  let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type}.merge(piece_rule_parameters) }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action_to: user1 }

  context "#valid_plies" do
    context 'orthogonal_line' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_maximum: nil } }

      it_should_behave_like "match coordinate validity", {
        valid: [[0,4], [4,0], [4,7], [7,4]],
        invalid: [[4,4], [3,2]]
      }
    end

    context 'diagonal_line' do
      let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_maximum: nil } }

      it_should_behave_like "match coordinate validity", {
        valid: [[1,1], [1,7], [7,1], [7,7]],
        invalid: [[4,4], [3,2]]
      }
    end

    context 'orthogonal_with_turns' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_maximum: 2 } }

      it_should_behave_like "match coordinate validity", {
        valid: [[2,4], [3,3], [3,4], [3,5], [4,2], [4,3], [4,5], [4,6], [5,3], [5,4], [5,5], [6,4]],
        invalid: [[4,4], [0,0]]
      }
    end

    context 'diagonal_with_turns' do
      let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_maximum: 2 } }

      it_should_behave_like "match coordinate validity", {
        valid: [[3,3], [5,3], [5,5], [3,5], [2,2], [2,4], [2,6], [4,6], [6,6], [6,4], [6,2], [4,2]],
        invalid: [[4,4], [0,0]]
      }
    end

    context 'encounter piece' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_maximum: nil } }
      before do
        game.pieces.create!(piece_type: piece_type, user: owner, coordinate: {'x' => 4, 'y' => 6})
      end

      context 'friendly' do
        let(:owner) { user1 }

        it_should_behave_like "match coordinate validity", {
          valid: [[4,5]],
          invalid: [[4,6], [4,7]]
        }
      end

      context 'enemy' do
        let(:owner) { user2 }

        it_should_behave_like "match coordinate validity", {
          valid: [[4,5], [4,6]],
          invalid: [[4,7]]
        }
      end
    end
  end
end
