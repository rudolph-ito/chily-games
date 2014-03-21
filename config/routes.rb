Cyvasse::Application.routes.draw do
  ActiveAdmin.routes(self)

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
        get 'review'
        put 'update_review'
      end
    end
  end

  resources :discussions, only: [:show] do
    resources :topics, only: [:new, :create]
  end

  resources :piece_rules, only: [:edit, :update, :destroy]
  resources :piece_types, only: [:index]
  resources :quotes, only: [:index, :show]
  resources :terrain_rules, only: [:edit, :update, :destroy]
  resources :terrain_types

  resources :topics, only: [:show, :edit, :update, :destroy] do
    resources :comments, only: [:create]
  end

  devise_for :users
  resources :users, only: [:show, :edit, :update, :destroy]

  resources :variants do
    resources :piece_rules, only: [:new, :create]
    resources :terrain_rules, only: [:new, :create]
  end

  get '/play' => 'play#play'

  get '/creator' => 'home#creator'
  get '/invariants' => 'home#invariants'
  put '/request_creator' => 'home#request_creator'

  root to: 'home#index'
end
