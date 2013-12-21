require 'spec_helper'

describe "Game: hexagonal board" do
  let(:piece_type) { create :piece_type }
  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 0, 'y' => 0, 'z' => 0} }

  let(:variant_parameters) { {} }
  let(:variant) { create :variant, board_type: 'hexagonal', board_size: 6  }

  let(:piece_rule_parameters) { {} }
  let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type}.merge(piece_rule_parameters) }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action_to: user1 }

  context "valid_plies" do
    context 'orthogonal_line' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_maximum: nil } }

      it_should_behave_like "match coordinate validity", {
        valid: [[5,0,0], [-5,0,0], [0,5,0], [0,-5,0], [0,0,5], [0,0,-5]],
        invalid: [[0,0,0], [-1,1,2]]
      }
    end

    context 'diagonal_line' do
      let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_maximum: nil } }

      it_should_behave_like "match coordinate validity", {
        valid: [[0,2,2], [2,2,0], [2,0,-2], [0,-2,-2], [-2,-2,0], [-2,0,2]],
        invalid: [[0,0,0], [-1,1,2]]
      }
    end

    context 'orthogonal_with_turns' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

      it_should_behave_like "match coordinate validity", {
        valid: [
          [0,0,2], [0,1,1], [0,2,0], [1,1,0], [2,0,0], [1,0,-1], [0,0,-2], [0,-1,-1], [0,-2,0], [-1,-1,0], [-2,0,0], [-1,0,1]
        ],
        invalid: [[0,0,0], [0,0,1], [3,0,0]]
      }
    end

    context 'diagonal_with_turns' do
      let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

      it_should_behave_like "match coordinate validity", {
        valid: [
          [0,2,2], [2,2,0], [2,0,-2], [0,-2,-2], [-2,-2,0], [-2,0,2],
          [0,0,3], [0,3,0], [3,0,0], [0,0,-3], [0,-3,0], [-3,0,0]

        ],
        invalid: [[0,0,0], [0,1,4]]
      }
    end

    context 'encounter piece' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_maximum: nil } }
      before do
        game.pieces.create!(piece_type: piece_type, user: owner, coordinate: {'x' => 0, 'y' => 0, 'z' => 2})
      end

      context 'friendly' do
        let(:owner) { user1 }

        it_should_behave_like "match coordinate validity", {
          valid: [[0,0,1]],
          invalid: [[0,0,2], [0,0,3]]
        }
      end

      context 'enemy' do
        let(:owner) { user2 }

        it_should_behave_like "match coordinate validity", {
          valid: [[0,0,1], [0,0,2]],
          invalid: [[0,0,3]]
        }
      end
    end
  end
end
