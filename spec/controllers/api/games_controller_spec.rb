require 'spec_helper'

describe Api::GamesController do
  render_views

  describe 'current' do
    let(:game_parameters) { {} }
    let!(:game) { create(:game, game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'returns game id' do
          get :current, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({id: game.id})
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'returns game id' do
          get :current, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({id: game.id})
        end
      end

      context 'not in game' do
        it 'returns nil' do
          get :current, format: :json
          expect(response.status).to eql 200
          expect(response.body).to be_json({id: nil})
        end
      end
    end
  end

  describe 'show' do
    let(:game_parameters) { {} }
    let(:game) { create(:game, {variant: create(:variant_with_square_board)}.merge(game_parameters)) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          get :show, id: game.id, format: :json
          expect(response.status).to eql 200
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          get :show, id: game.id, format: :json
          expect(response.status).to eql 200
        end
      end
    end
  end

  describe 'abort' do
    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup'}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          expect {
            put :abort, id: game.id, format: :json
            expect(response.status).to eql 200
          }.to change(Game, :count).by(-1)
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          expect {
            put :abort, id: game.id, format: :json
            expect(response.status).to eql 200
          }.to change(Game, :count).by(-1)
        end
      end
    end
  end

  describe 'setup_add_piece' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          expect {
            put :setup_add_piece, id: game.id, piece_type_id: piece_type.id, coordinate: {'x' => '0', 'y' => '0'}, format: :json
            expect(response.status).to eql 200
          }.to change(Piece, :count).by(1)
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          expect {
            put :setup_add_piece, id: game.id, piece_type_id: piece_type.id, coordinate: {'x' => '7', 'y' => '7'}, format: :json
            expect(response.status).to eql 200
          }.to change(Piece, :count).by(1)
        end
      end
    end
  end

  describe 'setuo_move_piece' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }
        let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }

        it 'succeeds' do
          put :setup_move_piece, id: game.id, from: {'x' => '0', 'y' => '0'}, to: {'x' => '2', 'y' => '2'}, format: :json
          expect(response.status).to eql 200
          expect(piece.reload.coordinate).to eql({'x' => 2, 'y' => 2})
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }
        let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }

        it 'succeeds' do
          put :setup_move_piece, id: game.id, from: {'x' => '7', 'y' => '7'}, to: {'x' => '5', 'y' => '5'}, format: :json
          expect(response.status).to eql 200
          expect(piece.reload.coordinate).to eql({'x' => 5, 'y' => 5})
        end
      end
    end
  end

  describe 'setup_remove_piece' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type }

    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }
        let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }

        it 'succeeds' do
          expect {
            put :setup_remove_piece, id: game.id, coordinate: {'x' => '0', 'y' => '0'}, format: :json
            expect(response.status).to eql 200
          }.to change(Piece, :count).by(-1)
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }
        let!(:piece) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }

        it 'succeeds' do
          expect {
            put :setup_remove_piece, id: game.id, coordinate: {'x' => '7', 'y' => '7'}, format: :json
            expect(response.status).to eql 200
          }.to change(Piece, :count).by(-1)
        end
      end
    end
  end

  describe 'setup_complete' do
    let(:piece_type) { create :piece_type }
    let(:variant) { create :variant, board_type: 'square', board_rows: 8, board_columns: 8, number_of_pieces: 2 }
    let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, count_minimum: 2, count_maximum: 2}

    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'setup', variant: variant}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        context 'no errors' do
          let!(:piece1) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '0'} }
          let!(:piece2) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '0', 'y' => '1'} }

          context 'opponent not setup' do
            it 'returns success and change state to onyx - setup' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'setup', action_to_id: game.onyx_id})
            end
          end

          context 'opponent setup' do
            before { game.update_attributes(action_to: game.alabaster)}

            it 'returns success and change state to alabaster - move' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'move', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ["Please place 2 pieces. You placed 0.", "Please place 2 #{piece_type.name}. You placed 0."]})
          end
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        context 'no errors' do
          let!(:piece1) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '7'} }
          let!(:piece2) { create :piece, game: game, user: current_user, piece_type: piece_type, coordinate: {'x' => '7', 'y' => '6'} }

          context 'opponent not setup' do
            it 'returns success and change state to alabaster - setup' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'setup', action_to_id: game.alabaster_id})
            end
          end

          context 'opponent setup' do
            before { game.update_attributes(action_to: game.onyx)}

            it 'returns success and change state to alabaster - move' do
              put :setup_complete, id: game.id, format: :json
              expect(response.status).to eql 200
              expect(response.body).to be_json({success: true, action: 'move', action_to_id: game.alabaster_id})
            end
          end
        end

        context 'errors' do
          it 'returns errors' do
            put :setup_complete, id: game.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json({success: false, errors: ["Please place 2 pieces. You placed 0.", "Please place 2 #{piece_type.name}. You placed 0."]})
          end
        end
      end
    end
  end

  describe 'play' do
  end

  describe 'resign' do
    let(:game_parameters) { {} }
    let!(:game) { create :game, {action: 'move'}.merge(game_parameters) }

    context 'when signed in', :signed_in do
      context 'as alabaster' do
        let(:game_parameters) { { alabaster: current_user } }

        it 'succeeds' do
          expect {
            put :resign, id: game.id, format: :json
            expect(response.status).to eql 200
          }.to change(Game, :count).by(-1)
        end
      end

      context 'as onyx' do
        let(:game_parameters) { { onyx: current_user } }

        it 'succeeds' do
          expect {
            put :resign, id: game.id, format: :json
            expect(response.status).to eql 200
          }.to change(Game, :count).by(-1)
        end
      end
    end
  end
end
