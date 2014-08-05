require 'spec_helper'

describe TerrainRulesController do
  render_views

  let!(:variant) { create :variant }

  describe 'new' do
    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        it 'succeeds' do
          get :new, variant_id: variant.id
          expect(response.status).to eql 200
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          get :new, variant_id: variant.id
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :new, variant_id: variant.id
        expect(response).to redirect_to new_user_session_path
      end
    end
  end

  describe 'create' do
    let(:terrain_type) { create(:terrain_type) }
    let(:valid_attributes) { { terrain_type_id: terrain_type.id, count: 1, passable_movement_effect_type: 'none', passable_range_effect_type: 'none', slows_movement_effect_type: 'none', stops_movement_effect_type: 'none'} }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        context 'with valid attributes' do
          it 'creates and redirects' do
            expect {
              post :create, variant_id: variant.id, terrain_rule: valid_attributes
              expect(response).to redirect_to variant
            }.to change(TerrainRule, :count).by(1)
          end
        end

        context 'with invalid attributes' do
          it 'does not create and renders new' do
            expect {
              post :create, variant_id: variant.id, terrain_rule: valid_attributes.merge(passable_movement_effect_type: nil)
              expect(response).to render_template 'new'
            }.to change(TerrainRule, :count).by(0)
          end
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          expect {
            post :create, variant_id: variant.id, terrain_rule: valid_attributes
            expect(response).to redirect_to root_path
          }.to change(TerrainRule, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, variant_id: variant.id, terrain_rule: valid_attributes
          expect(response).to redirect_to new_user_session_path
        }.to change(TerrainRule, :count).by(0)
      end
    end
  end

  describe 'edit' do
    let(:terrain_rule) { create :terrain_rule, variant: variant }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        it 'succeeds' do
          get :edit, id: terrain_rule.id
          expect(response.status).to eql 200
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          get :edit, id: terrain_rule.id
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: terrain_rule.id
        expect(response).to redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:terrain_rule) { create :terrain_rule, variant: variant, count: 1 }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        context 'with valid attributes' do
          it 'updates and redirects to variant' do
            put :update, id: terrain_rule.id, terrain_rule: { count: 2 }
            expect(terrain_rule.reload.count).to eql 2
            expect(response).to redirect_to variant
          end
        end

        context 'with invalid attributes' do
          it 'renders edit' do
            put :update, id: terrain_rule.id, terrain_rule: { count: nil }
            expect(terrain_rule.reload.count).to eql 1
            expect(response).to render_template 'edit'
          end
        end
      end

      context 'for other variant' do
        it 'redirects to root' do
          put :update, id: terrain_rule.id, terrain_rule: { count: 2 }
          expect(terrain_rule.reload.count).to eql 1
          expect(response).to redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: terrain_rule.id, terrain_rule: { count: 2 }
        expect(terrain_rule.reload.count).to eql 1
        expect(response).to redirect_to new_user_session_path
      end
    end
  end

  describe 'destroy' do
    let!(:terrain_rule) { create :terrain_rule, variant: variant }

    context 'when signed in', :signed_in do
      context 'for own variant' do
        let(:variant) { create :variant, user: current_user }

        it 'destroys and redirects to variant' do
          expect{
            delete :destroy, variant_id: variant.id, id: terrain_rule.id
            expect(response).to redirect_to variant
          }.to change(TerrainRule, :count).by(-1)
        end
      end

      context 'for other variant' do
        it 'redirects to root_path' do
          expect{
            delete :destroy, variant_id: variant.id, id: terrain_rule.id
            expect(response).to redirect_to root_path
          }.to change(TerrainRule, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, variant_id: variant.id, id: terrain_rule.id
          expect(response).to redirect_to new_user_session_path
        }.to change(TerrainRule, :count).by(0)
      end
    end
  end
end
