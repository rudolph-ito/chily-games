require 'spec_helper'

describe Api::ChallengesController do
  render_views

  describe 'index' do
    context 'when signed in', :signed_in do
      let(:user) { create :user, username: 'John' }
      let(:variant) { create :variant, user: user }
      let!(:challenge) { create :challenge, variant: variant }

      it 'succeeds' do
        get :index, format: :json
        expect(response.status).to eql 200
        expect(response.body).to be_json([{
          "challenger_id"=> challenge.challenger_id,
          "challenged_id"=> challenge.challenged_id,
          "id"=> challenge.id,
          "play_as"=> challenge.play_as,
          "variant_id"=> variant.id,
          "challenger"=> challenge.challenger.username,
          "variant"=> "Cyvasse by John"
        }])
      end

      context 'your' do
        it 'succeeds' do
          get :index, your: 1, format: :json
          expect(response.status).to eql 200
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :index, format: :json
        expect(response.status).to eql 401
      end
    end
  end

  describe 'create' do
    let(:variant) { create(:variant) }
    let(:valid_attributes) { { variant_id: variant.id, play_as: 'alabaster' } }

    context 'when signed in', :signed_in do
      context 'with valid attributes' do
        it 'creates and returns the challenge' do
          expect {
            post :create, challenge: valid_attributes, format: :json
            expect(response.status).to eql 200
          }.to change(Challenge, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, challenge: valid_attributes.merge(variant_id: ''), format: :json
            expect(response.status).to eql 422
            expect(response.body).to be_json(variant: ["can't be blank"])
          }.to change(Challenge, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, challenge: valid_attributes, format: :json
          expect(response.status).to eql 401
        }.to change(Challenge, :count).by(0)
      end
    end
  end

  describe 'destroy' do
    let!(:challenge) { create :challenge }

    context 'when signed in', :signed_in do
      context 'for own challenge' do
        let(:challenge) { create :challenge, challenger: current_user }

        it 'destroys' do
          expect{
            delete :destroy, id: challenge.id, format: :json
            expect(response.status).to eql 200
            expect(response.body).to be_json(challenge_id: challenge.id)
          }.to change(Challenge, :count).by(-1)
        end
      end

      context 'for other challenge' do
        it 'redirects to root_path' do
          expect{
            delete :destroy, id: challenge.id, format: :json
            expect(response.status).to eql 401
          }.to change(Challenge, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: challenge.id, format: :json
          expect(response.status).to eql 401
        }.to change(Challenge, :count).by(0)
      end
    end
  end

  describe 'accepting/declining' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:user3) { create(:user) }

    context 'when signed in' do
      context 'challenged specified' do
        let!(:challenge) { create(:challenge, challenger: user1, challenged: user2) }

        context 'challenged' do
          before { sign_in user2 }

          context 'accepting' do
            it 'creates a game and returns the id and destroys the challenge' do
              expect {
                put :accept, id: challenge.id, format: :json
                expect(response.status).to eql 200

                game = Game.last
                expect(response.body).to be_json(challenge_id: challenge.id, game: {id: game.id, alabaster_id: game.alabaster_id, onyx_id: game.onyx_id})
              }.to change(Game, :count).by(1)
            end

            it 'destroys the challenge' do
              expect {
                put :accept, id: challenge.id, format: :json
              }.to change(Challenge, :count).by(-1)
            end
          end

          context 'declining' do
            it 'returns success and destroys the challenge' do
              expect {
                put :decline, id: challenge.id, format: :json
                expect(response.status).to eql 200
                expect(response.body).to be_json(challenge_id: challenge.id)
              }.to change(Challenge, :count).by(-1)
            end
          end
        end

        context 'some other user' do
          before { sign_in user3 }

          context 'accepting' do
            it 'is unauthorized' do
              put :accept, id: challenge.id, format: :json
              expect(response.status).to eql 401
            end
          end

          context 'declining' do
            it 'is unauthorized' do
              put :decline, id: challenge.id, format: :json
              expect(response.status).to eql 401
            end
          end
        end
      end

      context 'challenged unspecified' do
        let!(:challenge) { create(:challenge, challenger: user1) }

        context 'any user' do
          before { sign_in user2 }

          context 'accepting' do
            it 'creates a game and returns the game id' do
              expect {
                put :accept, id: challenge.id, format: :json
                expect(response.status).to eql 200

                game = Game.last
                expect(response.body).to be_json(challenge_id: challenge.id, game: {id: game.id, alabaster_id: game.alabaster_id, onyx_id: game.onyx_id})
              }.to change(Game, :count).by(1)
            end

            it 'destroys the challenge' do
              expect {
                put :accept, id: challenge.id, format: :json
              }.to change(Challenge, :count).by(-1)
            end
          end

          context 'declining' do
            it 'is unauthorized' do
              put :decline, id: challenge.id, format: :json
              expect(response.status).to eql 401
            end
          end
        end

        context 'challenger' do
          before { sign_in user1 }

          context 'accepting' do
            it 'is unauthorized' do
              put :accept, id: challenge.id, format: :json
              expect(response.status).to eql 401
            end
          end

          context 'declining' do
            it 'is unauthorized' do
              put :decline, id: challenge.id, format: :json
              expect(response.status).to eql 401
            end
          end
        end
      end
    end

    context 'when not signed in' do
      let(:challenge) { create(:challenge) }

      context 'accepting' do
        it 'redirects to login' do
          put :accept, id: challenge.id, format: :json
          expect(response.status).to eql 401
        end
      end

      context 'declining' do
        it 'redirects to login' do
          put :decline, id: challenge.id, format: :json
          expect(response.status).to eql 401
        end
      end
    end
  end

end
