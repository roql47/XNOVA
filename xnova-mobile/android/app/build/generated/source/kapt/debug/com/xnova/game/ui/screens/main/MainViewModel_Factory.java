package com.xnova.game.ui.screens.main;

import com.xnova.game.data.local.TokenManager;
import com.xnova.game.data.repository.GameRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class MainViewModel_Factory implements Factory<MainViewModel> {
  private final Provider<GameRepository> gameRepositoryProvider;

  private final Provider<TokenManager> tokenManagerProvider;

  public MainViewModel_Factory(Provider<GameRepository> gameRepositoryProvider,
      Provider<TokenManager> tokenManagerProvider) {
    this.gameRepositoryProvider = gameRepositoryProvider;
    this.tokenManagerProvider = tokenManagerProvider;
  }

  @Override
  public MainViewModel get() {
    return newInstance(gameRepositoryProvider.get(), tokenManagerProvider.get());
  }

  public static MainViewModel_Factory create(Provider<GameRepository> gameRepositoryProvider,
      Provider<TokenManager> tokenManagerProvider) {
    return new MainViewModel_Factory(gameRepositoryProvider, tokenManagerProvider);
  }

  public static MainViewModel newInstance(GameRepository gameRepository,
      TokenManager tokenManager) {
    return new MainViewModel(gameRepository, tokenManager);
  }
}
