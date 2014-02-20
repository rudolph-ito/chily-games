Cyvasse::Application.routes.draw do
  namespace :api, defaults: { format: :json } do
    resources :challenges, only: [:index, :create, :destroy] do
      member do
        put 'accept'
        put 'decline'
      end
    end

    resources :games, only: [:show] do
      collection do
        get 'current'
      end

      member do
        get 'valid_piece_moves'
        get 'opponent_setup'

        put 'abort'
        put 'setup_add'
        put 'setup_move'
        put 'setup_remove'
        put 'setup_complete'

        put 'piece_move'
        put 'piece_move_with_range_capture'
        put 'resign'
      end
    end

    resources :variants, only: [] do
      member do
        get 'preview'
      end
    end
  end

  resources :piece_rules, only: [:edit, :update, :destroy]
  resources :piece_types

  resources :terrain_rules, only: [:edit, :update, :destroy]
  resources :terrain_types

  devise_for :users
  resources :users

  resources :variants do
    resources :piece_rules, only: [:new, :create]
    resources :terrain_rules, only: [:new, :create]
  end

  get '/explore' => 'home#explore'
  get '/create' => 'home#create'
  get '/play' => 'play#play'

  root to: 'home#index'
end
